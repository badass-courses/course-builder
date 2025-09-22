import { db } from '@/db'
import { contentResourceResource } from '@/db/schema'
import LiveOfficeHoursInvitation from '@/emails/live-office-hours-fixed'
import { generateICSAttachments } from '@/emails/utils/generate-ics-attachments'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'
import { sendAnEmail } from '@/utils/send-an-email'
import { and, eq } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

import { SEND_OFFICE_HOURS_EMAIL } from '../events/send-office-hours-email'

/*
SQL for Purchasers:
SELECT DISTINCT u.name, u.email
FROM User u
INNER JOIN Purchase p ON u.id = p.userId
WHERE p.productId = 'xxx'
  AND p.status IN ('Valid', 'Restricted');
*/
const fullPurchasers = []

export const liveOfficeHoursEmailProps = {
	eventTitle: 'Master the Model Context Protocol (MCP)',
	eventDate: 'September 22nd, 2025',
	days: [
		{
			date: 'September 22nd, 2025',
			events: [
				{
					startTime: '9:30 AM (PDT)',
					endTime: '10:30 AM (PDT)',
					isoStartDate: '2025-09-22T16:30:00Z',
					isoEndDate: '2025-09-22T17:30:00Z',
					liveLink: 'https://youtube.com/live/ZOLb2-vsmiA',
				},
				{
					startTime: '7:00 PM (PDT)',
					endTime: '8:00 PM (PDT)',
					isoStartDate: '2025-09-23T02:00:00Z',
					isoEndDate: '2025-09-23T03:00:00Z',
					liveLink: 'https://youtube.com/live/x8fBKfnAbk8',
				},
			],
		},
		{
			date: 'September 26th, 2025',
			events: [
				{
					startTime: '9:30 AM (PDT)',
					endTime: '10:30 AM (PDT)',
					isoStartDate: '2025-09-26T16:30:00Z',
					isoEndDate: '2025-09-26T17:30:00Z',
					liveLink: 'https://youtube.com/live/w9LYUBy3uaQ',
				},
				{
					startTime: '7:00 PM (PDT)',
					endTime: '8:00 PM (PDT)',
					isoStartDate: '2025-09-27T02:00:00Z',
					isoEndDate: '2025-09-27T03:00:00Z',
					liveLink: 'https://youtube.com/live/sJppkqjMJoA',
				},
			],
		},
		{
			date: 'September 29th, 2025',
			events: [
				{
					startTime: '9:30 AM (PDT)',
					endTime: '10:30 AM (PDT)',
					isoStartDate: '2025-09-29T16:30:00Z',
					isoEndDate: '2025-09-29T17:30:00Z',
					liveLink: 'https://youtube.com/live/AJu_zu1g5dY',
				},
				{
					startTime: '7:00 PM (PDT)',
					endTime: '8:00 PM (PDT)',
					isoStartDate: '2025-09-30T02:00:00Z',
					isoEndDate: '2025-09-30T03:00:00Z',
					liveLink: 'https://youtube.com/live/J-zI-773Nqw',
				},
			],
		},
		{
			date: 'October 3rd, 2025',
			events: [
				{
					startTime: '9:30 AM (PDT)',
					endTime: '10:30 AM (PDT)',
					isoStartDate: '2025-10-03T16:30:00Z',
					isoEndDate: '2025-10-03T17:30:00Z',
					liveLink: 'https://youtube.com/live/TIX7Pe0t0k8',
				},
				{
					startTime: '7:00 PM (PDT)',
					endTime: '8:00 PM (PDT)',
					isoStartDate: '2025-10-04T02:00:00Z',
					isoEndDate: '2025-10-04T03:00:00Z',
					liveLink: 'https://youtube.com/live/Y197GKaodXs',
				},
			],
		},
	],
}

export const sendOfficeHoursEmail = inngest.createFunction(
	{
		id: `send-office-hours-email`,
		name: `Send Office Hours Email`,
	},
	[
		{
			event: SEND_OFFICE_HOURS_EMAIL,
		},
	],
	async ({ event, step, db: adapter }) => {
		const testPurchasers = [
			{
				email: 'zac@egghead.io',
				name: 'Zac',
			},
			{
				email: 'nicoll@egghead.io',
				name: 'Nicoll',
			},
			// 	{
			// 		email: 'zac+nullname@egghead.io',
			// 		name: null,
			// },
		]
		// const purchasers1 = fullPurchasers.slice(0, 10)
		// const purchasers2 = fullPurchasers.slice(10, 100)
		// const purchasers3 = fullPurchasers.slice(100, 600)
		// const purchasers4 = fullPurchasers.slice(600)

		const purchasers = [
			{ name: 'Austin', email: 'austin.christensen37@gmail.com' },
			,
			{ name: 'Kevin', email: 'kevinreber1@gmail.com' },
			{ name: 'Nate', email: 'nate91711@gmail.com' },
			{ name: null, email: 'apricotsoul@gmail.com' },
			{ name: 'Marcelo', email: 'marcelobragatte@gmail.com' },
			{ name: 'Brook', email: 'brooksbenson03@gmail.com' },
			{ name: 'Peter', email: 'peter@deseloper.com' },
			{ name: 'Jacob', email: 'jacobtory@yahoo.com' },
			{ name: null, email: 'courses@murimessias.com.br' },
			{ name: 'Norm', email: 'norm.crandall@gmail.com' },
			{ name: 'Meni', email: 'meni@pentera.io' },
			{ name: 'Remoun', email: 'remoun.metyas@gmail.com' },
			{ name: 'Travis', email: 'travis.ramos5@gmail.com' },
			{ name: null, email: 'github.ycr63@aleeas.com' },
			{ name: null, email: 'tze.jing.hoo@gmail.com' },
			{ name: 'Barry', email: 'barry.mcgee@integralcode.co.uk' },
			{ name: null, email: 'retiredcanadianpoet@gmail.com' },
			{ name: null, email: 'jm.alvarez.vano@gmail.com' },
			{ name: null, email: 'yovany.lg@gmail.com' },
			{ name: null, email: 'brbeut@gmail.com' },
			{ name: null, email: 'minhnguyenxx@gmail.com' },
			{ name: null, email: 'emil@sonesson.io' },
			{ name: 'Alan', email: 'alan@ginsoaked.com' },
			{ name: 'Andre', email: 'me@andrekovac.com' },
			{ name: null, email: 'web-engineering-team@elliptic.co' },
			{ name: 'Garrett', email: 'garrett.kucinski@gmail.com' },
			{ name: 'Neethan', email: 'neethan.bala@gmail.com' },
			{ name: 'Neil', email: 'neiljkrishnan@gmail.com' },
			{ name: 'James', email: 'james.q.quick@gmail.com' },
		] as const

		for (const purchaser of purchasers) {
			await step.run(
				`send live office hours emails to past purchaser ${purchaser?.email}`,
				async () => {
					try {
						await sendAnEmail({
							Component: LiveOfficeHoursInvitation,
							componentProps: {
								...liveOfficeHoursEmailProps,
								userFirstName: purchaser?.name?.split(' ')[0],
								messageType: 'transactional',
							},
							Subject: `${liveOfficeHoursEmailProps.eventTitle} - ${liveOfficeHoursEmailProps.eventDate}`,
							To: purchaser?.email as string,
							ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
							From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
							type: 'transactional',
							attachments: generateICSAttachments(
								liveOfficeHoursEmailProps.days,
								liveOfficeHoursEmailProps.eventTitle,
							),
						})

						log.info(`Live office hours email sent to past purchaser`, {
							email: purchaser?.email,
							name: purchaser?.name,
						})

						return {
							email: purchaser?.email,
						}
					} catch (error) {
						throw new NonRetriableError(
							`Error sending live office hours email to past purchaser`,
							{
								cause: error,
							},
						)
						log.error(
							`Error sending live office hours email to past purchaser`,
							{
								error,
								email: purchaser?.email,
								name: purchaser?.name,
							},
						)
					}
				},
			)
		}

		return {
			success: true,
			emailsSent: purchasers.length,
		}
	},
)

const getContentIdsForTier = async (
	cohortResourceId: string,
	purchasedTier: 'standard' | 'premium' | 'vip',
) => {
	const allowedTiers = {
		standard: ['standard'],
		premium: ['standard', 'premium'],
		vip: ['standard', 'premium', 'vip'],
	}
	// Determine which tiers are allowed based on the purchased tier
	const allowedTierList = allowedTiers[purchasedTier] || ['standard'] // Default to standard

	const accessibleContent = await db.query.contentResourceResource.findMany({
		where: and(eq(contentResourceResource.resourceOfId, cohortResourceId)),
		with: {
			resource: true, // Fetch the related content resource
		},
	})

	// Filter based on metadata.tier
	const filteredContent = accessibleContent.filter((entry) => {
		const resourceTier = entry.metadata?.tier || 'standard' // Default to 'standard' if not set
		return allowedTierList.includes(resourceTier)
	})

	return filteredContent.map((entry) => entry.resource.id)
}
