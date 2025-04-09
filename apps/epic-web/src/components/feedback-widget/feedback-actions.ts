'use server'

import { db } from '@/db'
import { users } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { getServerAuthSession } from '@/server/auth'
import { sendAnEmail } from '@/utils/send-an-email'
import { eq } from 'drizzle-orm'
import sanitizeHtml from 'sanitize-html'

import {
	getEmoji,
	type FeedbackContext,
} from '@coursebuilder/ui/feedback-widget'

export type SendFeedbackFromUserOptions = {
	emailAddress?: string
	feedbackText: string
	context?: FeedbackContext
}

export async function sendFeedbackFromUser({
	emailAddress,
	feedbackText,
	context,
}: SendFeedbackFromUserOptions): Promise<void> {
	try {
		const { session } = await getServerAuthSession()
		const user = (await db.query.users.findFirst({
			where: eq(users.email, session?.user?.email?.toLowerCase() || 'NO-EMAIL'),
		})) || { email: emailAddress, id: null, name: null }

		if (!user.email) {
			throw new Error('Not Authorized')
		}

		await sendAnEmail({
			Component: BasicEmail,
			componentProps: {
				body: `${sanitizeHtml(feedbackText)} <br/><br/><i>${
					context?.url ? context.url : ''
				}</i>`,
				messageType: 'transactional',
			},
			Subject: `${
				context?.emotion ? `${getEmoji(context?.emotion).image} ` : ''
			}Feedback from ${user.name ? user.name : user.email} about ${env.NEXT_PUBLIC_SITE_TITLE}`,
			To: env.NEXT_PUBLIC_SUPPORT_EMAIL,
			ReplyTo: user.email,
			type: 'transactional',
		})
	} catch (error: any) {
		throw new Error(`Error: ${error.message}`)
	}
}
