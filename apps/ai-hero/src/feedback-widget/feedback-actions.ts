'use server'

import { db } from '@/db'
import { users } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { FeedbackContext } from '@/feedback-widget/feedback-schema'
import { getEmoji } from '@/feedback-widget/get-emoji'
import { getServerAuthSession } from '@/server/auth'
import { sendAnEmail } from '@/utils/send-an-email'
import { eq } from 'drizzle-orm'
import sanitizeHtml from 'sanitize-html'

import { CourseBuilderConfig } from '@coursebuilder/core'

type SendFeedbackOptions = {
	text: string
	context: FeedbackContext
	email?: string
}

export type SendFeedbackFromUserOptions = {
	emailAddress?: string
	feedbackText: string
	context?: FeedbackContext
}

export async function sendFeedbackFromUser({
	emailAddress,
	feedbackText,
	context,
}: SendFeedbackFromUserOptions) {
	try {
		const { session } = await getServerAuthSession()
		const user = (await db.query.users.findFirst({
			where: eq(users.email, session.user?.email?.toLowerCase() || 'NO-EMAIL'),
		})) || { email: emailAddress, id: null, name: null }

		if (!user.email) {
			return {
				error: 'Error: Not Authorized',
			}
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

		return {
			success: true,
		}
	} catch (error: any) {
		return {
			error: `Error: ${error.message}`,
		}
	}
}
