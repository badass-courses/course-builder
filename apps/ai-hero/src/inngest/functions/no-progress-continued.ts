import BasicEmail from '@/emails/basic-email'
import { LESSON_COMPLETED_EVENT } from '@/inngest/events/lesson-completed'
import { NO_PROGRESS_MADE_EVENT } from '@/inngest/events/no-progress-made-event'
import { inngest } from '@/inngest/inngest.server'
import { sendAnEmail } from '@/utils/send-an-email'
import { Liquid } from 'liquidjs'

export const noProgressContinued = inngest.createFunction(
	{
		id: `no-progress-continued`,
		name: `No Progress: Continued`,
		idempotency: 'event.user.email',
	},
	{
		event: NO_PROGRESS_MADE_EVENT,
		if: 'event.data.type == "continued"',
	},
	async ({ event, step, db }) => {
		const user = await step.run(`get user`, async () => {
			return db.getUserById(event.user.id as string)
		})

		if (!user) {
			throw new Error(`user not found`)
		}

		let emailResourceId = 'email-cirsg'
		let emailSubject = 'Continue with ProNextJS'
		let emailPreview = `watch a lesson or two`
		let timeout = '3d'

		switch (event.data.messageCount) {
			case 0:
				break
			case 1:
				emailSubject = 'Your next lesson for ProNextJS'
				emailPreview = 'link inside'
				timeout = '7d'
				break
			case 2:
				emailSubject = 'Continue with ProNextJS for just a few minutes'
				emailPreview = 'make some progress'
				timeout = '12d'
				break
			case 3:
				emailSubject = 'Next.js still great'
				emailPreview = 'start the next lesson of ProNextJS'
				timeout = '21d'
				break
			default:
				emailSubject = 'Not too late for ProNextJS'
				emailPreview = 'pick it back up'
				timeout = '60d'
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
					return engine.parseAndRender(emailResource.fields?.body, {
						user: event.user,
						...(event.data.nextLessonUrl && {
							nextLessonUrl: event.data.nextLessonUrl,
						}),
					})
				} catch (e: any) {
					console.error(e.message)
					return emailResource.fields?.body
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
			timeout,
		})

		if (!progressEvent) {
			return await step.sendEvent(`send no progress event`, {
				name: NO_PROGRESS_MADE_EVENT,
				data: {
					messageCount: event.data.messageCount + 1,
					type: event.data.type,
				},
				user,
			})
		}

		return 'done'
	},
)
