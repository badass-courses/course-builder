'use server'

import { headers } from 'next/headers'
import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { log } from '@/server/logger'
import { redis } from '@/server/redis-client'
import { sendAnEmail } from '@/utils/send-an-email'
import { Ratelimit } from '@upstash/ratelimit'
import sanitizeHtml from 'sanitize-html'

import {
	TeamInquiryContext,
	TeamInquiryFormValues,
} from './team-inquiry-schema'

export type SendTeamInquiryOptions = TeamInquiryFormValues & {
	context?: TeamInquiryContext
}

export async function sendTeamInquiry({
	name,
	email,
	companyName,
	teamSize,
	message,
	website,
	timestamp,
	context,
}: SendTeamInquiryOptions) {
	try {
		const headersList = await headers()
		const ip = headersList.get('x-forwarded-for') || 'unknown'
		const userAgent = headersList.get('user-agent') || 'unknown'

		// Check honeypot
		if (website) {
			await log.info('team_inquiry.spam.honeypot', {
				ip,
				userAgent,
				email,
				companyName,
				teamSize,
			})
			return { success: true }
		}

		// Validate submission timing
		const submissionTime = new Date()
		const startTime = new Date(timestamp)
		const timeDiff = submissionTime.getTime() - startTime.getTime()

		if (timeDiff < 3000 || timeDiff > 3600000) {
			await log.info('team_inquiry.spam.timing', {
				ip,
				userAgent,
				email,
				companyName,
				timeDiff,
				timestamp,
				submissionTime: submissionTime.toISOString(),
			})
			return { success: true }
		}

		// Rate limiting
		const ratelimit = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(3, '24 h'),
		})

		const rateLimit = await ratelimit.limit(`team_inquiry_${ip}`)

		await log.info('team_inquiry.ratelimit', {
			ip,
			userAgent,
			limit: rateLimit.limit,
			remaining: rateLimit.remaining,
			reset: rateLimit.reset,
			withinLimit: rateLimit.success,
		})

		if (!rateLimit.success) {
			return { success: true }
		}

		// Only send email if we pass all spam checks
		const body = `
      Name: ${name}
      Company: ${companyName}
      Team Size: ${teamSize}
      Email: ${email}
      Message: ${message ? sanitizeHtml(message) : 'No message provided'}
      
      Source: ${context?.source || 'Direct'}
      URL: ${context?.url || 'N/A'}
      Submission Time: ${submissionTime.toISOString()}
      Form Load Time: ${timestamp}
      IP: ${ip}
      User Agent: ${userAgent}
    `

		await sendAnEmail({
			Component: BasicEmail,
			componentProps: {
				body,
				messageType: 'transactional',
			},
			Subject: `Team Inquiry from ${companyName} (${teamSize} employees)`,
			To: env.NEXT_PUBLIC_SUPPORT_EMAIL,
			ReplyTo: email,
			type: 'transactional',
		})

		// Log successful submission
		await log.info('team_inquiry.submitted', {
			ip,
			userAgent,
			email,
			companyName,
			teamSize,
			source: context?.source || 'Direct',
			url: context?.url,
		})

		return { success: true }
	} catch (error: any) {
		// Log actual errors
		await log.error('team_inquiry.error', {
			error: error.message,
			stack: error.stack,
		})
		return { error: 'Unable to send inquiry. Please try again.' }
	}
}
