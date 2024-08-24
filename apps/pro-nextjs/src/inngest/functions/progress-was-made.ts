import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { LESSON_COMPLETED_EVENT } from '@/inngest/events/lesson-completed'
import { inngest } from '@/inngest/inngest.server'
import { ModuleSchema } from '@/lib/module'
import { sendAnEmail } from '@/utils/send-an-email'
import { Liquid } from 'liquidjs'
import pluralize from 'pluralize'
import { z } from 'zod'

import {
	ContentResourceSchema,
	type ContentResource,
} from '@coursebuilder/core/schemas/content-resource-schema'

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

		const { progress, module } = await step.run(
			`get pro next js module progress`,
			async () => {
				for (let workshopModule of proNextJSModules) {
					const progress = await db.getModuleProgressForUser(
						event.user.id,
						workshopModule.fields.slug,
					)

					const completedLessonIds =
						progress?.completedLessons.map((p) => p.resourceId) || []

					if (completedLessonIds.includes(event.data.lessonId)) {
						return { progress, module: ModuleSchema.parse(workshopModule) }
					}
				}

				return { progress: null, module: null }
			},
		)

		if (!progress || !module) return 'no progress or module found'

		const nextResource = ContentResourceSchema.nullish().parse(
			progress.nextResource,
		)

		let emailResourceId = 'email-t21sa'
		let emailSubject = "You've made progress with ProNextJS"
		let emailPreview = 'keep going!'
		let emailCTA = `You got this.`
		let nextLessonUrl = progress
			? `${env.COURSEBUILDER_URL}/${pluralize(module.type)}/${module.fields.slug}/${nextResource?.fields?.slug}`
			: null

		switch (true) {
			case userProgress.length === 1:
				emailSubject = "You've taken the first step with ProNextJS"
				emailCTA = `How's the course so far?`
				break
			case userProgress.length > 1:
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

		return await step.run('send encouragement email', async () => {
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
	},
)
