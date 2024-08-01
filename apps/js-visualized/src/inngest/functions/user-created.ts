import { db } from '@/db'
import { communicationPreferences, userRoles } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'
import NewMemberEmail from '@/emails/new-member'
import { env } from '@/env.mjs'
import { USER_CREATED_EVENT } from '@/inngest/events/user-created'
import { inngest } from '@/inngest/inngest.server'
import { sendAnEmail } from '@/utils/send-an-email'
import { NonRetriableError } from 'inngest'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

export const userCreated = inngest.createFunction(
	{
		id: `user created`,
		name: 'User Created',
		idempotency: 'event.user.email',
	},
	{
		event: USER_CREATED_EVENT,
	},
	async ({ event, step }) => {
		const { preferenceType, preferenceChannel } = await step.run(
			'load the preference type and channel',
			async () => {
				const preferenceType =
					await db.query.communicationPreferenceTypes.findFirst({
						where: (cpt, { eq }) => eq(cpt.name, 'Newsletter'),
					})
				const preferenceChannel = await db.query.communicationChannel.findFirst(
					{
						where: (cc, { eq }) => eq(cc.name, 'Email'),
					},
				)
				return { preferenceType, preferenceChannel }
			},
		)

		if (!preferenceType || !preferenceChannel) {
			throw new NonRetriableError('Preference type or channel not found')
		}

		await step.run('create user role', async () => {
			const userRole = await db.query.roles.findFirst({
				where: (ur, { eq }) => eq(ur.name, 'user'),
			})

			if (!userRole) {
				throw new Error('User role not found')
			}

			await db.insert(userRoles).values({
				roleId: userRole.id,
				userId: event.user.id,
			})
		})

		await step.run('create the user preference', async () => {
			await db.insert(communicationPreferences).values({
				id: nanoid(),
				userId: event.user.id,
				preferenceTypeId: preferenceType.id,
				channelId: preferenceChannel.id,
				active: true,
				updatedAt: new Date(),
				optInAt: new Date(),
				createdAt: new Date(),
			})
		})

		const email = {
			subject: 'Welcome to JS Visualized',
		}

		const sendResponse = await step.run('send the email', async () => {
			return await sendAnEmail({
				Component: NewMemberEmail,
				componentProps: {
					userId: event.user.id,
					courseBuilderUrl: env.COURSEBUILDER_URL,
					supportPhysicalAddress: env.NEXT_PUBLIC_SUPPORT_PHYSICAL_ADDRESS,
				},
				Subject: email.subject,
				To: event.user.email,
				type: 'broadcast',
			})
		})

		return { sendResponse, email, user: event.user }
	},
)
