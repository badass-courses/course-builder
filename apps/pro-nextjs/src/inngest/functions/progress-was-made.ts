import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { LESSON_COMPLETED_EVENT } from '@/inngest/events/lesson-completed'
import { inngest } from '@/inngest/inngest.server'
import { sendAnEmail } from '@/utils/send-an-email'
import { Liquid } from 'liquidjs'
import pluralize from 'pluralize'

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

				return modules
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
						return { progress, module: workshopModule }
					}
				}

				return { progress: null, module: null }
			},
		)

		if (!progress || !module) return 'no progress or module found'

		let emailResourceId = 'email-t21sa'
		let emailSubject = "You've made progress with ProNextJS"
		let emailPreview = 'keep going!'
		let emailCTA = `You got this.`
		let nextLessonUrl = progress
			? `${env.COURSEBUILDER_URL}/${pluralize(module.type)}/${module.fields.slug}/${progress.nextResource?.fields.slug}`
			: null

		switch (true) {
			case userProgress.length === 1:
				emailSubject = "You've taken the first step with ProNextJS"
				emailCTA = `How's the course so far?`
				break
			case userProgress.length > 1:
				break
		}

		const emailResource = await step.run(`get email resource`, async () => {
			return db.getContentResource(emailResourceId)
		})

		if (!emailResource) {
			throw new Error(`email resource not found`)
		}

		const encouragementEmailBody: string = await step.run(
			`parse email body`,
			async () => {
				try {
					const engine = new Liquid()
					return engine.parseAndRender(emailResource.fields.body, {
						user: event.user,
						nextLessonUrl,
						emailCTA,
					})
				} catch (e: any) {
					console.error(e.message)
					return emailResource.fields.body
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
