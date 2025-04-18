import { db } from '@/db'
import { communicationPreferences } from '@/db/schema'
import BasicEmail, { BasicEmailProps } from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { EMAIL_SEND_BROADCAST } from '@/inngest/events/email-send-broadcast'
import { inngest } from '@/inngest/inngest.server'
import { NonRetriableError } from 'inngest'
import { customAlphabet } from 'nanoid'
import { Resend } from 'resend'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

export async function sendAnEmail<ComponentPropsType = any>({
	Component,
	componentProps,
	Subject,
	To,
	From = `${env.NEXT_PUBLIC_SITE_TITLE} <${env.NEXT_PUBLIC_SUPPORT_EMAIL}>`,
	type = 'transactional',
	unsubscribeLinkUrl,
}: {
	Component: (props: ComponentPropsType) => React.JSX.Element
	componentProps: ComponentPropsType
	Subject: string
	From?: string
	To: string
	type?: 'transactional' | 'broadcast'
	unsubscribeLinkUrl?: string
}) {
	const resend = new Resend(process.env.RESEND_API_KEY)

	return resend.emails.send({
		from: From,
		to: [To],
		subject: Subject,
		react: Component(componentProps),
		headers:
			type === 'broadcast' && unsubscribeLinkUrl
				? {
						'List-Unsubscribe': `<${unsubscribeLinkUrl}>`,
					}
				: {},
	})
}

export const emailSendBroadcast = inngest.createFunction(
	{
		id: `email-send-broadcast`,
		name: 'Email: Send Broadcast',
	},
	{
		event: EMAIL_SEND_BROADCAST,
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

		const user = await step.run('load the user', async () => {
			return db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, event.data.toUserId),
			})
		})

		if (!user) {
			throw new NonRetriableError(
				`User not found with id: ${event.data.toUserId}`,
			)
		}

		let preference = await step.run('load the user preference', async () => {
			return db.query.communicationPreferences.findFirst({
				where: (cp, { and, eq }) =>
					and(
						eq(cp.userId, user.id),
						eq(cp.preferenceTypeId, preferenceType.id),
					),
			})
		})

		if (!preference) {
			await step.run('create the user preference', async () => {
				await db.insert(communicationPreferences).values({
					id: nanoid(),
					userId: user.id,
					preferenceTypeId: preferenceType.id,
					channelId: preferenceChannel.id,
					active: true,
					updatedAt: new Date(),
					optInAt: new Date(),
					createdAt: new Date(),
				})
			})

			preference = await step.run('load the user preference', async () => {
				return db.query.communicationPreferences.findFirst({
					where: (cp, { and, eq }) =>
						and(
							eq(cp.userId, user.id),
							eq(cp.preferenceTypeId, preferenceType.id),
						),
				})
			})
		}

		if (!preference?.active) {
			return 'User has unsubscribed'
		}

		return await step.run('send the email', async () => {
			return await sendAnEmail<BasicEmailProps>({
				Component: BasicEmail,
				componentProps: {
					body: `hi from ${process.env.NEXT_PUBLIC_SITE_TITLE}`,
					preview: `hi there!`,
					unsubscribeLinkUrl: `${env.NEXT_PUBLIC_URL}unsubscribed?userId=${user.id}`,
					messageType: 'broadcast',
				},
				Subject: `${process.env.NEXT_PUBLIC_SITE_TITLE} Test`,
				To: user.email,
				type: 'broadcast',
				unsubscribeLinkUrl: `${env.NEXT_PUBLIC_URL}unsubscribed?userId=${user.id}`,
			})
		})
	},
)
