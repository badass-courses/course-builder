import { db as rawDb } from '@/db'
import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { LESSON_COMPLETED_EVENT } from '@/inngest/events/lesson-completed'
import { NO_PROGRESS_MADE_EVENT } from '@/inngest/events/no-progress-made-event'
import { inngest } from '@/inngest/inngest.server'
import { ModuleSchema } from '@/lib/module'
import { sendAnEmail } from '@/utils/send-an-email'
import { Redis } from '@upstash/redis'
import { sql } from 'drizzle-orm'
import { Liquid } from 'liquidjs'
import pluralize from 'pluralize'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

const redis = new Redis({
	url: env.UPSTASH_REDIS_REST_URL,
	token: env.UPSTASH_REDIS_REST_TOKEN,
})

export const progressWasMade = inngest.createFunction(
	{
		id: `progress-was-made`,
		name: 'Progress Was Made',
		debounce: {
			period: '22h',
			key: 'event.user.id',
		},
	},
	{
		event: LESSON_COMPLETED_EVENT,
	},
	async ({ event, step, db }) => {
		const userProgress =
			(await step.run(`get user progress`, async () => {
				return db.getLessonProgressForUser(event.user.id)
			})) || []

		const proNextJSModules = await step.run(
			`get pro next js product`,
			async () => {
				const productResources =
					(await db.getProductResources('product-ypo8b')) || []
				const modules = []
				for (let resource of productResources) {
					if (resource.type === 'workshop') {
						modules.push(resource)
					}
				}

				return z.array(ModuleSchema).parse(modules)
			},
		)

		const lessonParentModule = await step.run(
			`get lesson parent module`,
			async () => {
				const query = sql`
						SELECT COALESCE(workshop.id, direct_parent.id) AS rootModuleId,
									 COALESCE(workshop.type, direct_parent.type) AS rootModuleType
						FROM ContentResource AS resource
						LEFT JOIN (
								SELECT crr1.resourceId, cr1.id, cr1.type
								FROM ContentResourceResource AS crr1
								JOIN ContentResource AS cr1 ON crr1.resourceOfId = cr1.id
								WHERE cr1.type = 'workshop'
						) AS direct_parent ON resource.id = direct_parent.resourceId
						LEFT JOIN (
								SELECT crr2.resourceId, cr2.id, cr2.type
								FROM ContentResourceResource AS crr2
								JOIN ContentResourceResource AS crr3 ON crr2.resourceOfId = crr3.resourceId
								JOIN ContentResource AS cr2 ON crr3.resourceOfId = cr2.id
								WHERE cr2.type = 'workshop'
						) AS workshop ON resource.id = workshop.resourceId
						WHERE resource.id = ${event.data.lessonId}
						`
				const result = await rawDb.execute(query)

				const parsedResult = z
					.array(
						z.object({
							rootModuleId: z.string(),
							rootModuleType: z.string(),
						}),
					)
					.parse(result.rows)

				if (!parsedResult?.[0]) return null

				return ModuleSchema.parse(
					await db.getContentResource(parsedResult[0].rootModuleId),
				)
			},
		)

		if (!lessonParentModule) return 'no module found'

		const progress = await step.run(
			`get pro next js module progress`,
			async () => {
				return await db.getModuleProgressForUser(
					event.user.id,
					lessonParentModule.fields.slug,
				)
			},
		)

		if (!progress) return 'no progress or module found'

		const moduleComplete =
			progress.completedLessonsCount === progress.totalLessonsCount

		const nextResource = ContentResourceSchema.nullish().parse(
			progress.nextResource,
		)

		let emailResourceId = 'email-t21sa'
		let emailSubject = "You've made progress with ProNextJS"
		let emailPreview = 'keep going!'
		let emailCTA = `You got this.`
		let nextLessonUrl = progress
			? `${env.COURSEBUILDER_URL}/${pluralize(lessonParentModule.type)}/${lessonParentModule.fields.slug}/${nextResource?.fields?.slug}`
			: null

		switch (true) {
			case userProgress.length === 1:
				emailSubject = "You've taken the first step with ProNextJS"
				emailCTA = `How's the course so far?`
				break
			case moduleComplete:
				emailSubject = `You've completed ${lessonParentModule.fields.title}`
				emailCTA = `How did you feel about the workshop?`
				nextLessonUrl = `${env.COURSEBUILDER_URL}/workshops`
				break
		}

		const emailBody: string = await step.run(
			`get a email resource`,
			async () => {
				const resource = await db.getContentResource(emailResourceId)
				return resource?.fields?.body || ''
			},
		)

		if (!emailBody) {
			throw new Error(`email resource not found`)
		}

		const encouragementEmailBody: string = await step.run(
			`parse email body`,
			async () => {
				if (!emailBody) return ''
				try {
					const engine = new Liquid()
					return engine.parseAndRender(emailBody, {
						user: event.user,
						nextLessonUrl,
						emailCTA,
					})
				} catch (e: any) {
					console.error(e.message)
					return emailBody
				}
			},
		)

		await step.run('send encouragement email', async () => {
			return await sendAnEmail({
				Component: BasicEmail,
				componentProps: {
					body: encouragementEmailBody,
					preview: emailPreview,
					messageType: 'transactional',
				},
				Subject: emailSubject,
				To: event.user.email,
				type: 'transactional',
			})
		})

		const progressEvent = await step.waitForEvent(`wait for any progress`, {
			event: LESSON_COMPLETED_EVENT,
			timeout: '2d',
		})

		if (!progressEvent) {
			return await step.sendEvent(`send no progress event`, {
				name: NO_PROGRESS_MADE_EVENT,
				data: {
					messageCount: 0,
					type: 'continued',
					nextLessonUrl,
				},
				user,
			})
		}
	},
)
