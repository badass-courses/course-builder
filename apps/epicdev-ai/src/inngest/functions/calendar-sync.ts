import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { EventSchema, type Event } from '@/lib/events'
import { getEventOrEventSeries } from '@/lib/events-query'
import {
	createGoogleCalendarEvent,
	getGoogleCalendarEvent,
	removeUserFromGoogleCalendarEvent,
	updateGoogleCalendarEvent,
} from '@/lib/google-calendar'
import { calendar_v3 } from 'googleapis'
import { GetFunctionInput, NonRetriableError } from 'inngest'
import { marked } from 'marked'

import { REFUND_PROCESSED_EVENT } from '@coursebuilder/core/inngest/commerce/event-refund-processed'

import {
	RESOURCE_CREATED_EVENT,
	RESOURCE_UPDATED_EVENT,
} from '../events/resource-management'
import { inngest } from '../inngest.server'

export const EVENT_HOST_EMAIL = 'me@kentcdodds.com'
const EVENT_HOST_DISPLAY_NAME = 'Kent C. Dodds'

/**
 * Maps the fields from our Event resource to the Google Calendar API format.
 *
 * @param {Event} eventResource The event resource from our database.
 * @returns {calendar_v3.Schema$Event | null} Google Calendar event payload or null if required fields are missing.
 */
async function mapResourceToGoogleEvent(
	eventResource: Event,
): Promise<Partial<calendar_v3.Schema$Event> | null> {
	const fields = eventResource.fields

	if (!fields.startsAt) {
		console.warn(
			`Event resource ${eventResource.id} is missing startsAt, cannot create/update Google Calendar event.`,
		)
		return null // Cannot create an event without a start time
	}

	// Google Calendar API requires both start and end times.
	// If endsAt is missing, maybe default to 1 hour duration?
	// For now, let's require it for simplicity, but this could be adjusted.
	if (!fields.endsAt) {
		console.warn(
			`Event resource ${eventResource.id} is missing endsAt, cannot create/update Google Calendar event.`,
		)
		return null
	}

	const timezone = fields.timezone || 'America/Los_Angeles' // Default timezone if not set
	const description = fields.details || fields.body || fields.description || '' // Use details, body, fallback to description

	const htmlDescription = await marked(description, {
		gfm: true,
		breaks: false,
	})

	return {
		summary: fields.title,
		description: htmlDescription.replace(/\n/g, ''), // Remove all newlines for nice formatting in Google Calendar
		start: {
			dateTime: fields.startsAt,
			timeZone: timezone,
		},
		end: {
			dateTime: fields.endsAt,
			timeZone: timezone,
		},
		guestsCanInviteOthers: false,
		guestsCanSeeOtherGuests: false,

		// Consider adding other fields like location if available/needed
	}
}

export const calendarSync = inngest.createFunction(
	// Argument 1: Function Config
	{
		id: 'calendar-sync',
		name: 'Google Calendar Sync for Events',
	},
	// Argument 2: Trigger Config
	[
		{ event: RESOURCE_CREATED_EVENT, if: "event.data.type == 'event'" },
		{ event: RESOURCE_UPDATED_EVENT, if: "event.data.type == 'event'" },
	],
	// Argument 3: Handler Function with explicit event type union
	async ({ event, step }) => {
		const resourceId = event.data.id
		console.log(
			`Received event for resource: ${resourceId} (event name: ${event.name})`,
		)

		// Step 1: Fetch the full resource details
		const eventResource = await step.run('fetch-event-resource', async () => {
			return await courseBuilderAdapter.getContentResource(resourceId)
		})

		if (!eventResource) {
			// If the resource doesn't exist shortly after the event, it likely won't appear later.
			throw new NonRetriableError(`Event resource not found: ${resourceId}`)
		}

		// Step 2: Validate the resource schema
		const validation = EventSchema.safeParse(eventResource)
		if (!validation.success) {
			console.error('Schema Validation Error:', validation.error)
			throw new NonRetriableError(
				`Invalid event resource format for ${resourceId}: ${validation.error.message}`,
			)
		}
		const validEventResource = validation.data

		// Step 3: Check prerequisite environment variables
		if (!env.GOOG_CALENDAR_IMPERSONATE_USER) {
			throw new Error('GOOG_CALENDAR_IMPERSONATE_USER not configured.') // Retriable, maybe env var is temporarily missing
		}
		if (!env.GOOG_CREDENTIALS_JSON) {
			throw new Error('GOOG_CREDENTIALS_JSON not configured.') // Retriable
		}

		// Step 4: Map resource fields to Google Calendar Event payload
		const partialGoogleEventPayload =
			await mapResourceToGoogleEvent(validEventResource)

		if (!partialGoogleEventPayload) {
			// Required fields (like startsAt) were missing.
			console.log(
				`Skipping Google Calendar sync for ${resourceId} due to missing required fields.`,
			)
			return { skipped: true, reason: 'Missing required fields' }
		}

		let currentCalendarId = validEventResource.fields.calendarId
		let outcome: 'created' | 'updated' | 'skipped' = 'skipped'
		let finalCalendarId: string | null = currentCalendarId || null
		let requiresCreation = !currentCalendarId

		// Step 5a: Check and attempt update if calendarId exists
		if (currentCalendarId) {
			console.log(
				`Checking existing Google Calendar event ${currentCalendarId} for resource ${resourceId}`,
			)
			let existingGoogleEvent: calendar_v3.Schema$Event | null = null
			try {
				existingGoogleEvent = await step.run('get-google-event', async () => {
					return await getGoogleCalendarEvent(currentCalendarId!)
				})
			} catch (error: any) {
				console.error(`Failed to get Google event ${currentCalendarId}:`, error)
				// If get fails for reasons other than 404 (already handled in lib), let it retry
				throw error
			}

			if (!existingGoogleEvent || existingGoogleEvent.status === 'cancelled') {
				// Event doesn't exist on Google's side or is cancelled
				console.log(
					`Google Calendar event ${currentCalendarId} not found or cancelled. Will attempt to create a new one.`,
				)
				requiresCreation = true // Mark for creation
				finalCalendarId = null // Clear the stale ID
			} else {
				// Event exists and is not cancelled, proceed with update
				console.log(
					`Attempting update for existing Google Calendar event ${currentCalendarId}`,
				)
				try {
					const updatedEvent = await step.run(
						'update-google-event',
						async () => {
							return await updateGoogleCalendarEvent(
								currentCalendarId!,
								partialGoogleEventPayload,
							)
						},
					)

					if (updatedEvent) {
						console.log(
							`Successfully updated Google Calendar event ${currentCalendarId}`,
						)
						outcome = 'updated'
						// finalCalendarId remains currentCalendarId
					} else {
						// Update returned null (404 Not Found), which is unexpected after a successful get
						// Log it and proceed to create, just in case of race conditions or weirdness
						console.warn(
							`Update failed (404) for Google Calendar event ${currentCalendarId} immediately after get succeeded. Proceeding to create.`,
						)
						requiresCreation = true
						finalCalendarId = null
					}
				} catch (error: any) {
					console.error(
						`Failed to update Google event ${currentCalendarId}:`,
						error,
					)
					throw error // Allow retries for other update errors
				}
			}
		}

		// Step 5b: Create if needed
		if (requiresCreation) {
			// TODO: If creating a new event because the old one was cancelled/deleted,
			// any existing attendees from the old event need to be re-added.
			// This requires fetching attendees from the old event (if possible via API even when cancelled)
			// or storing attendee info alongside our resource.
			console.log(
				`Creating new Google Calendar event for resource ${resourceId}`,
			)

			if (
				!partialGoogleEventPayload.summary ||
				!partialGoogleEventPayload.start ||
				!partialGoogleEventPayload.end
			) {
				throw new NonRetriableError(
					`Mapped payload is missing essential fields (summary, start, end) for resource ${resourceId}`,
				)
			}

			const payloadForCreation: calendar_v3.Schema$Event = {
				...partialGoogleEventPayload,
				organizer: {
					email: EVENT_HOST_EMAIL,
					displayName: EVENT_HOST_DISPLAY_NAME,
				},
				attendees: [
					{
						email: EVENT_HOST_EMAIL,
						displayName: EVENT_HOST_DISPLAY_NAME,
						responseStatus: 'accepted',
					},
				],
			}

			let createdGoogleEvent: calendar_v3.Schema$Event | null = null
			try {
				createdGoogleEvent = await step.run('create-google-event', async () => {
					return await createGoogleCalendarEvent(payloadForCreation)
				})

				if (createdGoogleEvent?.id) {
					outcome = 'created'
					finalCalendarId = createdGoogleEvent.id
				} else {
					console.error(
						`Google event created for ${resourceId}, but no ID was returned.`,
					)
					throw new NonRetriableError(
						'Google event created but ID missing from response.',
					)
				}
			} catch (error: any) {
				console.error(`Failed to create Google event for ${resourceId}:`, error)
				throw error // Allow retries
			}
		}

		// Step 5c: Update our resource with the new/final Google Calendar ID if it changed
		if (
			finalCalendarId &&
			finalCalendarId !== validEventResource.fields.calendarId
		) {
			console.log(
				`Updating resource ${resourceId} with final calendar ID ${finalCalendarId}`,
			)
			try {
				await step.run('update-resource-with-calendar-id', async () => {
					await courseBuilderAdapter.updateContentResourceFields({
						id: validEventResource.id,
						fields: {
							...validEventResource.fields,
							calendarId: finalCalendarId,
						},
					})
				})
			} catch (error: any) {
				console.error(
					`Failed to update resource ${resourceId} with calendar ID ${finalCalendarId}:`,
					error,
				)
				// If DB update fails after successful GCal operation, let it retry.
				throw error
			}
		}

		return { outcome: outcome, calendarId: finalCalendarId }
	},
)

export const handleRefundAndRemoveFromCalendar = inngest.createFunction(
	{
		id: 'refund-remove-calendar-attendee',
		name: 'Handle Refund and Remove Calendar Attendee',
		// TODO: Define a more specific type for the event data if available
		// type RefundProcessedEvent = GetFunctionInput<typeof REFUND_PROCESSED_EVENT>['data']
	},
	{ event: REFUND_PROCESSED_EVENT },
	async ({ event, step, logger }) => {
		const chargeId = event.data.stripeChargeId || event.data.merchantChargeId
		if (!chargeId) {
			logger.error('No chargeId found in the event data.', { event })
			throw new NonRetriableError('Refund processed event is missing chargeId.')
		}

		logger.info(`Processing refund for chargeId: ${chargeId}`)

		// Step 0: Verify adapter methods exist
		if (
			!courseBuilderAdapter.getMerchantCharge ||
			!courseBuilderAdapter.getPurchaseForStripeCharge ||
			!courseBuilderAdapter.getUser ||
			!courseBuilderAdapter.getProduct ||
			!courseBuilderAdapter.getContentResource
		) {
			logger.error(
				'One or more required CourseBuilderAdapter methods are missing.',
			)
			throw new NonRetriableError(
				'Adapter methods missing, cannot process refund for calendar removal.',
			)
		}

		// Step 1: Fetch Purchase by Charge ID directly
		const purchase = await step.run(
			'fetch-purchase-by-stripe-charge-id',
			async () => {
				const result =
					await courseBuilderAdapter.getPurchaseForStripeCharge!(chargeId)
				if (!result) {
					throw new NonRetriableError(
						`Purchase not found for charge ID: ${chargeId}`,
					)
				}
				if (!result.userId || !result.productId) {
					throw new NonRetriableError(
						`Purchase for charge ID: ${chargeId} is missing userId or productId.`,
					)
				}
				return { userId: result.userId, productId: result.productId }
			},
		)

		if (!purchase) {
			logger.error(`Purchase not found for chargeId: ${chargeId}, stopping.`)
			return {
				outcome: 'error',
				reason: 'Purchase not found',
				chargeId,
			}
		}

		const { userId, productId: purchasedProductId } = purchase

		logger.info(
			`Found purchase: userId=${userId}, purchasedProductId=${purchasedProductId}`,
		)

		// Step 3: Fetch Product details to check its type
		const purchasedProduct = await step.run(
			'fetch-purchased-product-details',
			async () => {
				const p = await courseBuilderAdapter.getProduct!(purchasedProductId)
				if (!p) {
					throw new NonRetriableError(
						`Product not found: ${purchasedProductId} (from purchase related to chargeId: ${chargeId})`,
					)
				}
				return p
			},
		)

		if (!purchasedProduct) {
			logger.error(`Product ${purchasedProductId} not found, stopping.`)
			return {
				outcome: 'error',
				reason: 'Purchased product not found',
				purchasedProductId,
			}
		}

		const productType = purchasedProduct.type
		logger.info(
			`Purchased product ${purchasedProductId} has type: ${productType}`,
		)

		if (productType !== 'live' && productType !== 'cohort') {
			logger.info(
				`Purchased product ${purchasedProductId} is not of type 'live' or 'cohort' (type is '${productType}'). Skipping calendar removal.`,
			)
			return {
				outcome: 'skipped',
				reason: 'Purchased product not a live event or cohort',
				purchasedProductId: purchasedProductId,
				productType: productType,
			}
		}

		// Step 4: Find the 'event' type ContentResource associated with the product
		const eventResourceIds = await step.run(
			'find-event-resource-ids-for-product',
			async () => {
				const resources = purchasedProduct.resources

				if (!Array.isArray(resources)) {
					logger.warn(
						`Product ${purchasedProductId} does not have a 'resources' array or it's not an array. Cannot find event resource.`,
					)
					return []
				}

				// For live products: find any event or event-series
				if (productType === 'live') {
					const foundEventResource = resources.find((item) =>
						['event', 'event-series'].includes(item.resource?.type),
					)?.resource

					return foundEventResource ? [foundEventResource.id] : []
				}

				// For cohort products: find office hours events
				if (productType === 'cohort') {
					const officeHoursEvents = []
					for (const item of resources) {
						if (['event', 'event-series'].includes(item.resource?.type)) {
							// Get the full event resource to check if it's office hours
							const eventResource =
								await courseBuilderAdapter.getContentResource(item.resource.id)
							if (eventResource && isOfficeHoursEvent(eventResource)) {
								officeHoursEvents.push(item.resource.id)
							}
						}
					}
					return officeHoursEvents
				}

				return []
			},
		)

		if (eventResourceIds.length === 0) {
			logger.warn(
				`No event resource IDs found linked to ${productType} product ${purchasedProductId}. Skipping calendar removal.`,
			)
			return {
				outcome: 'skipped',
				reason: `No event resource IDs linked to the ${productType} product`,
				purchasedProductId,
			}
		}

		logger.info(
			`Found ${eventResourceIds.length} event resource ID(s) linked to product ${purchasedProductId}: ${eventResourceIds.join(', ')}`,
		)

		// Step 5: Fetch User by User ID to get email
		const user = await step.run('fetch-user-by-id', async () => {
			const usr = await courseBuilderAdapter.getUser!(userId)
			if (!usr) {
				throw new NonRetriableError(`User not found: ${userId}`)
			}
			if (!usr.email) {
				throw new NonRetriableError(`User email not found for user: ${userId}`)
			}
			return { email: usr.email }
		})

		if (!user?.email) {
			logger.error(`User or user email not found for userId: ${userId}`)
			return {
				outcome: 'error',
				reason: 'User or user email not found',
				userId,
			}
		}

		logger.info(`Found user email: ${user.email} for userId: ${userId}`)

		// Step 6: Process each event resource for calendar removal
		const removalResults = []
		let totalSuccessfulRemovals = 0
		let totalFailedRemovals = 0

		for (const eventResourceId of eventResourceIds) {
			logger.info(`Processing event resource ${eventResourceId} for removal`)

			// Fetch and validate Event Resource
			const validEventResource = await step.run(
				`fetch-and-validate-event-resource-${eventResourceId}`,
				async () => {
					const ev = await getEventOrEventSeries(eventResourceId)
					if (!ev) {
						throw new NonRetriableError(
							`Event resource ${eventResourceId} not found or failed validation`,
						)
					}
					return ev
				},
			)

			if (!validEventResource) {
				logger.error(
					`Event resource ${eventResourceId} could not be fetched or validated.`,
				)
				removalResults.push({
					eventResourceId,
					outcome: 'error',
					reason: 'Event resource fetch/validation failed',
				})
				totalFailedRemovals++
				continue
			}

			// Handle calendar removal based on resource type
			if (validEventResource.type === 'event-series') {
				// Handle event series - remove from each child event
				if (
					!validEventResource.resources ||
					validEventResource.resources.length === 0
				) {
					logger.warn(
						`Event series ${eventResourceId} has no child events. Nothing to remove.`,
					)
					removalResults.push({
						eventResourceId,
						outcome: 'skipped',
						reason: 'Event series has no child events',
					})
					continue
				}

				const childResults = []
				logger.info(
					`Processing event series ${eventResourceId} with ${validEventResource.resources.length} child events`,
				)

				for (const { resource } of validEventResource.resources) {
					if (
						resource?.type === 'event' &&
						'calendarId' in resource.fields &&
						resource.fields.calendarId
					) {
						try {
							await step.run(
								`remove-user-from-event-${resource.id}`,
								async () => {
									await removeUserFromGoogleCalendarEvent(
										resource.fields.calendarId as string,
										user.email,
									)
								},
							)

							logger.info(
								`Successfully removed user ${user.email} from calendar event ${resource.fields.calendarId} (${resource.fields.title})`,
							)
							childResults.push({
								eventId: resource.id,
								eventTitle: resource.fields.title,
								calendarId: resource.fields.calendarId,
								outcome: 'success',
							})
							totalSuccessfulRemovals++
						} catch (error: any) {
							logger.error(
								`Failed to remove user ${user.email} from calendar event ${resource.fields.calendarId} (${resource.fields.title}): ${error.message}`,
								{ error },
							)
							childResults.push({
								eventId: resource.id,
								eventTitle: resource.fields.title,
								calendarId: resource.fields.calendarId,
								outcome: 'failed',
								error: error.message,
							})
							totalFailedRemovals++
						}
					} else {
						logger.warn(
							`Child resource ${resource?.id} is not an event or missing calendarId, skipping`,
						)
						childResults.push({
							eventId: resource?.id || 'unknown',
							eventTitle: resource?.fields?.title || 'unknown',
							calendarId: null,
							outcome: 'skipped',
							reason: 'Not an event or missing calendarId',
						})
					}
				}

				removalResults.push({
					eventResourceId,
					outcome: 'event-series-processed',
					eventSeriesTitle: validEventResource.fields.title,
					childResults,
					totalProcessed: childResults.length,
					successCount: childResults.filter((r) => r.outcome === 'success')
						.length,
					failedCount: childResults.filter((r) => r.outcome === 'failed')
						.length,
				})
			} else {
				// Handle single event
				if (
					!('calendarId' in validEventResource.fields) ||
					!validEventResource.fields.calendarId
				) {
					logger.warn(
						`Event resource ${eventResourceId} does not have a calendarId. Cannot remove user.`,
					)
					removalResults.push({
						eventResourceId,
						outcome: 'skipped',
						reason: 'calendarId missing from event resource',
					})
					continue
				}

				const calendarId = validEventResource.fields.calendarId as string
				logger.info(
					`Found calendarId: ${calendarId} for eventResource: ${eventResourceId}`,
				)

				try {
					await step.run(
						`remove-user-from-google-event-${eventResourceId}`,
						async () => {
							await removeUserFromGoogleCalendarEvent(calendarId, user.email)
						},
					)
					logger.info(
						`Successfully removed user ${user.email} from calendar event ${calendarId}`,
					)
					removalResults.push({
						eventResourceId,
						outcome: 'success',
						calendarId,
						eventTitle: validEventResource.fields.title,
					})
					totalSuccessfulRemovals++
				} catch (error: any) {
					logger.error(
						`Failed to remove user ${user.email} from calendar event ${calendarId}: ${error.message}`,
						{ error },
					)
					removalResults.push({
						eventResourceId,
						outcome: 'failed',
						calendarId,
						eventTitle: validEventResource.fields.title,
						error: error.message,
					})
					totalFailedRemovals++
				}
			}
		}

		// Return comprehensive results
		return {
			outcome:
				eventResourceIds.length > 1
					? 'multiple-events-processed'
					: 'single-event-processed',
			userId,
			email: user.email,
			productId: purchasedProductId,
			productType,
			totalEvents: eventResourceIds.length,
			totalSuccessfulRemovals,
			totalFailedRemovals,
			eventResults: removalResults,
		}
	},
)

/**
 * Determines if an event is an office hours event based on title or tags
 * Not currently used, but keeping for reference
 */
function isOfficeHoursEvent(event: any): boolean {
	return true

	// Check title for "office hours" keywords
	// const titleLower = event.fields?.title?.toLowerCase() || ''
	// if (
	// 	titleLower.includes('office hours') ||
	// 	titleLower.includes('office hour')
	// ) {
	// 	return true
	// }

	// // Check tags for office hours
	// if (event.tags && Array.isArray(event.tags)) {
	// 	return event.tags.some((tagItem: any) => {
	// 		const tagName = tagItem.tag?.fields?.name?.toLowerCase() || ''
	// 		return tagName.includes('office hours') || tagName.includes('office hour')
	// 	})
	// }

	// return false
}
