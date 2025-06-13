import { WorkshopAccessEmail } from '@/emails/workshop-access-email'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import {
	getCohortProducts,
	getUsersEntitledToWorkshops,
	getWorkshopEmails,
	getWorkshopsStartingToday,
	type EmailUser,
} from '@/lib/cohort-workshop-emails-query'
import { getAllWorkshopsInCohort } from '@/lib/cohorts-query'
import type { Email } from '@/lib/emails'
import type { Workshop } from '@/lib/workshops'
import { getWorkshop } from '@/lib/workshops-query'
import { log } from '@/server/logger'
import { sendAnEmail } from '@/utils/send-an-email'

export const sendWorkshopAccessEmails = inngest.createFunction(
	{
		id: 'send-workshop-access-emails',
		name: 'Send Workshop Access Emails Daily',
	},
	{ cron: '0 15 * * *' }, // 8 AM PT = 3 PM UTC (15:00)
	async ({ event, step }) => {
		const startTime = Date.now()
		let totalEmailsSent = 0
		let totalWorkshopsProcessed = 0
		const errors: string[] = []

		// 1. Get all cohort products
		const cohortProducts = await step.run('get-cohort-products', async () => {
			try {
				return await getCohortProducts()
			} catch (error) {
				await log.error('Failed to get cohort products', { error })
				throw error
			}
		})

		await log.info('Workshop access emails job started', {
			cohortProductsFound: cohortProducts.length,
		})

		// 2. Process each cohort product
		for (const product of cohortProducts) {
			const productResult = await step.run(
				`process-product-${product.id}`,
				async () => {
					try {
						// Get cohort from product resources
						const cohortResource = product.resources?.find(
							(r) => r.resource?.type === 'cohort',
						)
						if (!cohortResource) {
							return { skipped: 'no cohort resource' }
						}

						// Get workshops in cohort
						const workshops = await getAllWorkshopsInCohort(
							cohortResource.resource.id,
						)

						// Filter workshops starting today
						const workshopsStartingToday =
							await getWorkshopsStartingToday(workshops)

						if (workshopsStartingToday.length === 0) {
							return { skipped: 'no workshops starting today' }
						}

						// Get all workshop IDs for entitlement lookup
						const workshopIds = workshopsStartingToday.map((w) => w.id)

						// Get users entitled to access these workshops
						const entitledUsers = await getUsersEntitledToWorkshops(workshopIds)

						if (entitledUsers.length === 0) {
							return { skipped: 'no entitled users found' }
						}

						// Process each workshop starting today
						let emailsSentForProduct = 0
						for (const workshop of workshopsStartingToday) {
							// Get users specifically entitled to this workshop
							const workshopEntitledUsers = await getUsersEntitledToWorkshops([
								workshop.id,
							])
							const emailsSent = await processWorkshopEmails(
								workshop,
								workshopEntitledUsers,
							)
							emailsSentForProduct += emailsSent
						}

						return {
							processed: workshopsStartingToday.length,
							emailsSent: emailsSentForProduct,
							entitledUsers: entitledUsers.length,
						}
					} catch (error) {
						const errorMsg = `Failed to process product ${product.id}: ${error}`
						errors.push(errorMsg)
						await log.error(errorMsg, { productId: product.id, error })
						return { error: errorMsg }
					}
				},
			)

			// Use type guards to safely access properties
			if ('emailsSent' in productResult && productResult.emailsSent) {
				totalEmailsSent += productResult.emailsSent
			}
			if ('processed' in productResult && productResult.processed) {
				totalWorkshopsProcessed += productResult.processed
			}
		}

		// 3. Log final summary
		return await step.run('log-summary', async () => {
			const endTime = Date.now()
			const summary = {
				totalProductsProcessed: cohortProducts.length,
				totalWorkshopsStartingToday: totalWorkshopsProcessed,
				totalEmailsSent,
				errors,
				processingTime: endTime - startTime,
			}

			await log.info('Workshop access emails job completed', summary)
			return summary
		})

		async function processWorkshopEmails(
			workshop: Workshop,
			entitledUsers: EmailUser[],
		): Promise<number> {
			try {
				// Get full workshop details with emails
				const fullWorkshop = await getWorkshop(workshop.id)
				if (!fullWorkshop) {
					await log.warn('Workshop not found', { workshopId: workshop.id })
					return 0
				}

				// Get workshop emails
				const emails = await getWorkshopEmails(fullWorkshop)

				// If no emails attached, create a default email
				if (emails.length === 0) {
					await log.info(
						'No emails attached to workshop, sending default email',
						{
							workshopId: workshop.id,
							workshopTitle: workshop.fields.title,
						},
					)

					// Create a default email object
					const defaultEmail = {
						id: 'default',
						fields: {
							title: `Your access to ${workshop.fields.title} opens today`,
							body: undefined, // No custom body, but the template has good hardcoded content
						},
					}

					// Send the default email to all entitled users
					let emailsSent = 0
					for (const user of entitledUsers) {
						try {
							await sendWorkshopAccessEmail({
								user,
								workshop,
								email: defaultEmail as any, // Cast to Email type
							})
							emailsSent++
						} catch (error) {
							const errorMsg = `Failed to send default email to ${user.email} for workshop ${workshop.fields.title}`
							errors.push(errorMsg)
							await log.error(errorMsg, {
								userId: user.id,
								workshopId: workshop.id,
								error,
							})
						}
					}

					await log.info('Workshop default emails processed', {
						workshopId: workshop.id,
						workshopTitle: workshop.fields.title,
						emailsAttached: 0,
						entitledUsers: entitledUsers.length,
						emailsSent,
					})

					return emailsSent
				}

				// Process attached emails normally
				let emailsSent = 0

				// Send each email to each entitled user
				for (const email of emails) {
					for (const user of entitledUsers) {
						try {
							await sendWorkshopAccessEmail({
								user,
								workshop,
								email,
							})
							emailsSent++
						} catch (error) {
							const errorMsg = `Failed to send email to ${user.email} for workshop ${workshop.fields.title}`
							errors.push(errorMsg)
							await log.error(errorMsg, {
								userId: user.id,
								workshopId: workshop.id,
								emailId: email.id,
								error,
							})
						}
					}
				}

				await log.info('Workshop emails processed', {
					workshopId: workshop.id,
					workshopTitle: workshop.fields.title,
					emailsAttached: emails.length,
					entitledUsers: entitledUsers.length,
					emailsSent,
				})

				return emailsSent
			} catch (error) {
				await log.error('Failed to process workshop emails', {
					workshopId: workshop.id,
					error,
				})
				return 0
			}
		}

		async function sendWorkshopAccessEmail({
			user,
			workshop,
			email,
		}: {
			user: EmailUser
			workshop: Workshop
			email: Email
		}) {
			await sendAnEmail({
				Component: WorkshopAccessEmail,
				componentProps: {
					user: {
						name: user.name || undefined,
						email: user.email,
					},
					workshop: {
						fields: {
							title: workshop.fields.title,
							description: workshop.fields.description || undefined,
							startsAt: workshop.fields.startsAt || undefined,
							slug: workshop.fields.slug || undefined,
						},
					},
					emailContent: {
						fields: {
							title: `Your access to ${workshop.fields.title} opens today`,
							body: email.fields.body || undefined,
						},
					},
				},
				To: user.email,
				Subject: email.fields.title,
				From: `${process.env.NEXT_PUBLIC_SITE_TITLE} <${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}>`,
			})

			await log.info('Workshop access email sent', {
				to: user.email,
				subject: email.fields.title,
				workshopTitle: workshop.fields.title,
			})
		}
	},
)
