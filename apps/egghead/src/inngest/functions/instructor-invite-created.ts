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
		const newInviteId = await step.run('create invite', async () => {
			const inviteId = nanoid()
			await db.insert(invites).values({
				id: inviteId,
				inviteState: 'INITIATED',
				inviteEmail: event.data.email,
				createdAt: new Date(),
			})

			return inviteId
		})

		const inviteUrl = `${process.env.COURSEBUILDER_URL}/invites/${newInviteId}`

		const sendResponse = await step.run('send the invite email', async () => {
			return await sendAnEmail({
				Component: InstructorInviteEmail,
				componentProps: {
					inviteUrl,
				},
				Subject: 'You have been invited to join egghead as an instructor',
				To: event.data.email,
				ReplyTo: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
				From: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
				type: 'transactional',
			})
		})

		return {
			email: event.data.email,
		}
	},
)
