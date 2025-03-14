import { db } from '@/db'
import { communicationPreferences, invites, userRoles } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'
import InstructorInviteEmail from '@/emails/instructor-invite-email'
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
		const inviteId = nanoid()

		await step.run('create invite', async () => {
			await db.insert(invites).values({
				id: inviteId,
				inviteState: 'INITIATED',
				inviteEmail: event.data.email,
				createdAt: new Date(),
			})
		})

		const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invites/${inviteId}`

		// const sendResponse = await step.run('send the email', async () => {
		// 	return await sendAnEmail({
		// 		Component: InstructorInviteEmail,
		// 		componentProps: {
		// 			inviteUrl,
		// 		},
		// 		Subject: 'You have been invited to join egghead as an instructor',
		// 		To: event.data.email,
		// 		type: 'broadcast',
		// 	})
		// })

		const sendResponse = await step.run('send the invite email', async () => {
			return await sendAnEmail({
				Component: BasicEmail,
				componentProps: {
					body: `click here to accept the invite`,
				},
				Subject: 'You have been invited to join egghead as an instructor',
				To: event.data.email,
				type: 'broadcast',
			})
		})

		return {
			email: event.data.email,
		}
	},
)
