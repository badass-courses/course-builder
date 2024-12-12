import { db } from '@/db'
import { communicationPreferences, invites, userRoles } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'
import { INSTRUCTOR_INVITE_CREATED_EVENT } from '@/inngest/events/instructor-invite-created'
import { inngest } from '@/inngest/inngest.server'
import { sendAnEmail } from '@/utils/send-an-email'
import { NonRetriableError } from 'inngest'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

export const instructorInviteCreated = inngest.createFunction(
	{
		id: `instructor invite created`,
		name: 'Instructor Invite Created',
	},
	{
		event: INSTRUCTOR_INVITE_CREATED_EVENT,
	},
	async ({ event, step }) => {
		// const email = {
		// 	body: `{{user.email}} signed up.`,
		// 	subject: 'egghead Post Builder Signup from {{user.email}}',
		// }

		await step.run('create invite', async () => {
			const invite = await db.insert(invites).values({
				id: nanoid(),
				inviteState: 'INITIATED',
				inviteEmail: event.data.email,
				createdAt: new Date(),
			})

			return invite
		})

		// const sendResponse = await step.run('send the email', async () => {
		// 	return await sendAnEmail({
		// 		Component: BasicEmail,
		// 		componentProps: {
		// 			body: email.body,
		// 		},
		// 		Subject: email.subject,
		// 		To: event.user.email,
		// 		type: 'broadcast',
		// 	})
		// })

		return {
			// sendResponse,
			// email,
			email: event.data.email,
		}
	},
)
