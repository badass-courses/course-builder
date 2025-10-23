'use server'

import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import type { UseFormReturn } from 'react-hook-form'
import sanitizeHtml from 'sanitize-html'

import { sendAnEmail } from '@coursebuilder/utils-email/send-an-email'

export const submitFeedbackForm = async (
	values: {
		text: string
		email: string
	},
	form: UseFormReturn<{
		text: string
		email: string
	}>,
) => {
	try {
		await sendAnEmail({
			Component: BasicEmail,
			componentProps: {
				body: `${sanitizeHtml(values.text)} <br/><br/><i>${values.email}</i>`,
				messageType: 'transactional',
			},
			Subject: `Contact form submission from ${values.email} about ${env.NEXT_PUBLIC_SITE_TITLE}`,
			To: env.NEXT_PUBLIC_SUPPORT_EMAIL,
			ReplyTo: values.email,
			type: 'transactional',
		})
	} catch (error) {
		form.setError('text', {
			message: error instanceof Error ? error.message : 'An error occurred',
		})
	}
}
