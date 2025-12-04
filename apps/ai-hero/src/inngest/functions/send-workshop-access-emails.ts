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
		name: 'Schedule Workshop Access Emails',
	},
	{ cron: '30 0 * * *' }, // Run at 0:30 UTC
	async ({ event, step }) => {
		const startTime = Date.now()
		let totalEmailsSent = 0
		let totalWorkshopsScheduled = 0
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

		await log.info('Workshop access emails scheduling started', {
			cohortProductsFound: cohortProducts.length,
		})

		// 2. Collect all workshops starting today from all cohort products
		const workshopsStartingToday = await step.run(
			'get-workshops-starting-today',
			async () => {
				const allWorkshopsStartingToday: Workshop[] = []

				await log.info('Starting to process cohort products', {
					totalProducts: cohortProducts.length,
				})

				for (const [index, product] of cohortProducts.entries()) {
					try {
						await log.info('Processing cohort product', {
							productIndex: index,
							productId: product.id,
							totalProducts: cohortProducts.length,
						})

						// Get cohort from product resources
						const cohortResource = product.resources?.find(
							(r) => r.resource?.type === 'cohort',
						)
						if (!cohortResource) {
							await log.info('No cohort resource found, skipping', {
								productId: product.id,
							})
							continue
						}

						await log.info('Found cohort resource, getting workshops', {
							productId: product.id,
							cohortId: cohortResource.resource.id,
						})

						// Get workshops in cohort
						const workshops = await getAllWorkshopsInCohort(
							cohortResource.resource.id,
						)

						await log.info('Got workshops from cohort, filtering for today', {
							productId: product.id,
							cohortId: cohortResource.resource.id,
							totalWorkshops: workshops.length,
						})

						// Filter workshops starting today using UTC-consistent function
						const startingToday = await getWorkshopsStartingToday(workshops)

						await log.info('Filtered workshops starting today', {
							productId: product.id,
							cohortId: cohortResource.resource.id,
							totalWorkshops: workshops.length,
							workshopsStartingToday: startingToday.length,
						})

						allWorkshopsStartingToday.push(...startingToday)

						await log.info('Cohort workshops processed successfully', {
							productId: product.id,
							totalWorkshops: workshops.length,
							workshopsStartingToday: startingToday.length,
							totalCollectedSoFar: allWorkshopsStartingToday.length,
						})
					} catch (error) {
						const errorMsg = `Failed to process cohort product ${product.id}: ${error}`
						errors.push(errorMsg)
						await log.error(errorMsg, { productId: product.id, error })
					}
				}

				await log.info('Completed processing all cohort products', {
					totalWorkshopsStartingToday: allWorkshopsStartingToday.length,
				})

				return allWorkshopsStartingToday
			},
		)

		await log.info('Workshops starting today found', {
			totalStartingToday: workshopsStartingToday.length,
		})

		// 3. Process each workshop starting today
		for (const workshop of workshopsStartingToday) {
			// First, validate and prepare the workshop
			const workshopPrep = await step.run(
				`prep-workshop-${workshop.id}`,
				async () => {
					try {
						if (!workshop.fields.startsAt) {
							return { skipped: 'no start date' }
						}

						// Preserve the exact UTC time from the database without conversion
						const workshopStartTimeString = workshop.fields.startsAt
						const workshopStartTime = new Date(workshopStartTimeString)
						const now = new Date()

						// If workshop starts in the past, skip it
						if (workshopStartTime <= now) {
							return { skipped: 'workshop already started' }
						}

						await log.info('Preparing workshop for scheduling', {
							workshopId: workshop.id,
							workshopTitle: workshop.fields.title,
							startTime: workshopStartTimeString,
							startTimeAsDate: workshopStartTime.toISOString(),
							timezone: workshop.fields.timezone || 'America/Los_Angeles',
							rawStartsAt: workshop.fields.startsAt,
						})

						return {
							ready: true,
							workshopStartTime: workshopStartTimeString, // Use original string to avoid timezone conversion
						}
					} catch (error) {
						const errorMsg = `Failed to prep workshop ${workshop.id}: ${error}`
						errors.push(errorMsg)
						await log.error(errorMsg, { workshopId: workshop.id, error })
						return { error: errorMsg }
					}
				},
			)

			// Skip if workshop prep failed or should be skipped
			if ('skipped' in workshopPrep || 'error' in workshopPrep) {
				continue
			}

			// Sleep until workshop start time (no nesting!)
			await step.sleepUntil(
				`wait-for-workshop-start-${workshop.id}`,
				workshopPrep.workshopStartTime, // Pass the ISO string directly
			)

			// Now send the emails after the sleep
			const workshopResult = await step.run(
				`send-emails-${workshop.id}`,
				async () => {
					try {
						// Get entitled users
						const entitledUsers = await getUsersEntitledToWorkshops([
							workshop.id,
						])

						if (entitledUsers.length === 0) {
							return { skipped: 'no entitled users found' }
						}

						const emailsSent = await processWorkshopEmails(
							workshop as Workshop, // DB serialization: Date fields become strings
							entitledUsers,
						)

						return {
							processed: true,
							emailsSent,
							entitledUsers: entitledUsers.length,
							sentAt: new Date().toISOString(),
						}
					} catch (error) {
						const errorMsg = `Failed to send emails for workshop ${workshop.id}: ${error}`
						errors.push(errorMsg)
						await log.error(errorMsg, { workshopId: workshop.id, error })
						return { error: errorMsg }
					}
				},
			)

			// Track results
			if ('emailsSent' in workshopResult && workshopResult.emailsSent) {
				totalEmailsSent += workshopResult.emailsSent
			}
			if ('processed' in workshopResult && workshopResult.processed) {
				totalWorkshopsScheduled += 1
			}
		}

		// 4. Log final summary
		return await step.run('log-summary', async () => {
			const endTime = Date.now()
			const summary = {
				totalProductsProcessed: cohortProducts.length,
				totalWorkshopsStartingToday: workshopsStartingToday.length,
				totalWorkshopsScheduled,
				totalEmailsSent,
				errors,
				processingTime: endTime - startTime,
			}

			await log.info('Workshop access emails scheduling completed', summary)
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
								workshop: fullWorkshop,
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
								workshop: fullWorkshop,
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
