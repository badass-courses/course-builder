'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { contentResourceProduct, contentResourceResource } from '@/db/schema'
import { EVENT_HOST_EMAIL } from '@/inngest/functions/calendar-sync'
import { getEventOrEventSeries } from '@/lib/events-query'
import {
	addUserToGoogleCalendarEvent,
	getGoogleCalendarEventAttendees,
} from '@/lib/google-calendar'
import { getProduct } from '@/lib/products-query'
import { getProductPurchaseData } from '@/lib/products/products.service'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { and, eq } from 'drizzle-orm'

import type { ProductEventInviteStatus } from './calendar-invite-types'

/**
 * Gets events associated with a product, filtered for office hours
 */
export async function getProductOfficeHoursEvents(productId: string) {
	// Get events directly associated with the product
	const productEvents = await db.query.contentResourceProduct.findMany({
		where: eq(contentResourceProduct.productId, productId),
		with: {
			resource: {
				with: {
					tags: {
						with: {
							tag: true,
						},
					},
				},
			},
		},
	})

	// Filter for events and event-series
	const eventResources = productEvents.filter(
		(pe) => pe.resource.type === 'event' || pe.resource.type === 'event-series',
	)

	// Parse and validate events
	const validEvents = []
	for (const eventResource of eventResources) {
		const parsedEvent = await getEventOrEventSeries(eventResource.resource.id)
		if (parsedEvent) {
			// Check if this is an office hours event
			const isOfficeHours = true // isOfficeHoursEvent(parsedEvent)
			if (isOfficeHours) {
				validEvents.push(parsedEvent)
			}
		}
	}

	return validEvents
}

/**
 * Gets invite status for office hours events associated with a product
 */
export async function getProductEventInviteStatus(
	productId: string,
): Promise<ProductEventInviteStatus> {
	const { ability } = await getServerAuthSession()

	if (!ability.can('update', 'Content')) {
		return {
			success: false,
			message: 'Unauthorized to view invite status',
			events: [],
			totalPurchasers: 0,
			purchaserEmails: [],
			inviteComparison: {
				totalUniqueInvited: 0,
				notInvited: [],
				invitedButNotPurchased: [],
				inviteRate: 0,
			},
		}
	}

	try {
		// Get product and validate it's a cohort
		const product = await getProduct(productId)
		if (!product) {
			return {
				success: false,
				message: 'Product not found',
				events: [],
				totalPurchasers: 0,
				purchaserEmails: [],
				inviteComparison: {
					totalUniqueInvited: 0,
					notInvited: [],
					invitedButNotPurchased: [],
					inviteRate: 0,
				},
			}
		}

		if (product.type !== 'cohort') {
			return {
				success: false,
				message: 'Product is not a cohort type',
				events: [],
				totalPurchasers: 0,
				purchaserEmails: [],
				inviteComparison: {
					totalUniqueInvited: 0,
					notInvited: [],
					invitedButNotPurchased: [],
					inviteRate: 0,
				},
			}
		}

		// Get office hours events and purchasers in parallel
		const [officeHoursEvents, purchaseData] = await Promise.all([
			getProductOfficeHoursEvents(product.id),
			getProductPurchaseData({
				productIds: [product.id],
				limit: 1000,
				offset: 0,
			}),
		])

		const purchaserEmails = purchaseData.data.map((p) => p.email)
		const eventStatuses = []
		const allInvitedEmails = new Set<string>()

		// Process each office hours event
		for (const event of officeHoursEvents) {
			const eventStatus = {
				eventId: event.id,
				eventTitle: event.fields?.title || 'Untitled Event',
				eventType: event.type as 'event' | 'event-series',
				calendarEvents: [] as Array<{
					calendarId: string
					eventTitle: string
					attendeeCount: number
					attendeeEmails: string[]
				}>,
				totalAttendees: 0,
				uniqueAttendeeEmails: [] as string[],
			}

			const eventAttendeeEmails = new Set<string>()

			// Handle both single events and event series
			if (event.type === 'event-series' && event.resources) {
				// Process each child event in the series
				for (const { resource: childEvent } of event.resources) {
					if (
						childEvent?.type === 'event' &&
						'calendarId' in childEvent.fields &&
						childEvent.fields.calendarId
					) {
						const calendarId = childEvent.fields.calendarId as string
						const attendees = await getGoogleCalendarEventAttendees(calendarId)

						if (attendees) {
							// Filter out the event host email from attendees
							const filteredAttendees = attendees.filter(
								(a) => a.email !== EVENT_HOST_EMAIL,
							)
							const attendeeEmails = filteredAttendees.map((a) => a.email)

							eventStatus.calendarEvents.push({
								calendarId,
								eventTitle: childEvent.fields.title || 'Untitled Child Event',
								attendeeCount: filteredAttendees.length,
								attendeeEmails,
							})

							// Add to event-level unique attendees (excluding host)
							attendeeEmails.forEach((email) => eventAttendeeEmails.add(email))
							// Add to global invited emails (excluding host)
							attendeeEmails.forEach((email) => allInvitedEmails.add(email))
						}
					}
				}
			} else if (
				event.type === 'event' &&
				'calendarId' in event.fields &&
				event.fields.calendarId
			) {
				// Single event
				const calendarId = event.fields.calendarId as string
				const attendees = await getGoogleCalendarEventAttendees(calendarId)

				if (attendees) {
					// Filter out the event host email from attendees
					const filteredAttendees = attendees.filter(
						(a) => a.email !== EVENT_HOST_EMAIL,
					)
					const attendeeEmails = filteredAttendees.map((a) => a.email)

					eventStatus.calendarEvents.push({
						calendarId,
						eventTitle: event.fields?.title || 'Untitled Event',
						attendeeCount: filteredAttendees.length,
						attendeeEmails,
					})

					// Add to event-level unique attendees (excluding host)
					attendeeEmails.forEach((email) => eventAttendeeEmails.add(email))
					// Add to global invited emails (excluding host)
					attendeeEmails.forEach((email) => allInvitedEmails.add(email))
				}
			}

			eventStatus.uniqueAttendeeEmails = Array.from(eventAttendeeEmails)
			eventStatus.totalAttendees = eventStatus.uniqueAttendeeEmails.length
			eventStatuses.push(eventStatus)
		}

		// Calculate comparison metrics
		const totalUniqueInvited = allInvitedEmails.size
		const notInvited = purchaserEmails.filter(
			(email) => !allInvitedEmails.has(email),
		)
		const invitedButNotPurchased = Array.from(allInvitedEmails).filter(
			(email) => !purchaserEmails.includes(email),
		)
		const inviteRate =
			purchaserEmails.length > 0
				? Math.round(
						((purchaserEmails.length - notInvited.length) /
							purchaserEmails.length) *
							100,
					)
				: 0

		await log.info('calendar.invite.status_checked', {
			productId,
			productName: product.name,
			totalPurchasers: purchaseData.data.length,
			totalUniqueInvited,
			inviteRate,
			notInvitedCount: notInvited.length,
			invitedButNotPurchasedCount: invitedButNotPurchased.length,
		})

		return {
			success: true,
			events: eventStatuses,
			totalPurchasers: purchaseData.data.length,
			purchaserEmails,
			inviteComparison: {
				totalUniqueInvited,
				notInvited,
				invitedButNotPurchased,
				inviteRate,
			},
		}
	} catch (error) {
		await log.error('calendar.invite.status_error', {
			productId,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})

		return {
			success: false,
			message: `Failed to get invite status: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`,
			events: [],
			totalPurchasers: 0,
			purchaserEmails: [],
			inviteComparison: {
				totalUniqueInvited: 0,
				notInvited: [],
				invitedButNotPurchased: [],
				inviteRate: 0,
			},
		}
	}
}

/**
 * Sends calendar invites to all purchasers of a cohort product for office hours events
 */
export async function sendCalendarInvitesToPurchasers(
	productId: string,
): Promise<{
	success: boolean
	message: string
	results?: {
		totalPurchasers: number
		totalEvents: number
		successfulInvites: number
		failedInvites: number
		details: Array<{
			eventTitle: string
			eventId: string
			calendarId?: string
			purchaserResults: Array<{
				email: string
				success: boolean
				error?: string
			}>
		}>
	}
}> {
	const { ability } = await getServerAuthSession()

	if (!ability.can('update', 'Content')) {
		return {
			success: false,
			message: 'Unauthorized to send calendar invites',
		}
	}

	try {
		await log.info('calendar.invite.started', {
			productId,
			action: 'send_calendar_invites_to_purchasers',
		})

		// Get product and validate it's a cohort
		const product = await getProduct(productId)
		if (!product) {
			return {
				success: false,
				message: 'Product not found',
			}
		}

		if (product.type !== 'cohort') {
			return {
				success: false,
				message: 'Product is not a cohort type',
			}
		}

		// Get office hours events associated with the product
		const officeHoursEvents = await getProductOfficeHoursEvents(product.id)

		if (officeHoursEvents.length === 0) {
			return {
				success: false,
				message: 'No office hours events found for this cohort product',
			}
		}

		// Get all purchasers of the product
		const purchaseData = await getProductPurchaseData({
			productIds: [product.id],
			limit: 1000, // Get all purchasers
			offset: 0,
		})

		if (purchaseData.data.length === 0) {
			return {
				success: false,
				message: 'No purchasers found for this product',
			}
		}

		await log.info('calendar.invite.processing', {
			productId,
			productName: product.name,
			totalPurchasers: purchaseData.data.length,
			totalOfficeHoursEvents: officeHoursEvents.length,
		})

		let successfulInvites = 0
		let failedInvites = 0
		const eventResults = []

		// Process each office hours event
		for (const event of officeHoursEvents) {
			const eventResult = {
				eventTitle: event.fields?.title || 'Untitled Event',
				eventId: event.id,
				calendarId: undefined as string | undefined,
				purchaserResults: [] as Array<{
					email: string
					success: boolean
					error?: string
				}>,
			}

			// Handle both single events and event series
			if (event.type === 'event-series' && event.resources) {
				// Process each child event in the series
				for (const { resource: childEvent } of event.resources) {
					if (
						childEvent?.type === 'event' &&
						'calendarId' in childEvent.fields &&
						childEvent.fields.calendarId
					) {
						await processEventInvites(
							childEvent.fields.calendarId as string,
							purchaseData.data,
							eventResult,
						)
					}
				}
			} else if (
				event.type === 'event' &&
				'calendarId' in event.fields &&
				event.fields.calendarId
			) {
				// Single event
				eventResult.calendarId = event.fields.calendarId as string
				await processEventInvites(
					event.fields.calendarId as string,
					purchaseData.data,
					eventResult,
				)
			}

			// Count successes and failures for this event
			const eventSuccesses = eventResult.purchaserResults.filter(
				(r) => r.success,
			).length
			const eventFailures = eventResult.purchaserResults.filter(
				(r) => !r.success,
			).length

			successfulInvites += eventSuccesses
			failedInvites += eventFailures

			eventResults.push(eventResult)
		}

		await log.info('calendar.invite.completed', {
			productId,
			productName: product.name,
			totalPurchasers: purchaseData.data.length,
			totalEvents: officeHoursEvents.length,
			successfulInvites,
			failedInvites,
		})

		revalidatePath(`/products/${product.fields?.slug || product.id}`)

		return {
			success: true,
			message: `Successfully processed calendar invites. ${successfulInvites} invites sent, ${failedInvites} failed.`,
			results: {
				totalPurchasers: purchaseData.data.length,
				totalEvents: officeHoursEvents.length,
				successfulInvites,
				failedInvites,
				details: eventResults,
			},
		}
	} catch (error) {
		await log.error('calendar.invite.error', {
			productId,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})

		return {
			success: false,
			message: `Failed to send calendar invites: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`,
		}
	}
}

/**
 * Helper function to process invites for a single event, with duplicate checking for Phase 2
 */
async function processEventInvites(
	calendarId: string,
	purchasers: Array<{
		user_id: string
		email: string
		name: string | null
		productId: string
		product_name: string
		purchase_date: string
	}>,
	eventResult: {
		eventTitle: string
		eventId: string
		calendarId?: string
		purchaserResults: Array<{
			email: string
			success: boolean
			error?: string
			skipped?: boolean
			reason?: string
		}>
	},
	skipAlreadyInvited: boolean = false,
) {
	if (!eventResult.calendarId) {
		eventResult.calendarId = calendarId
	}

	// Get existing attendees if we need to skip already invited users
	let existingAttendees: string[] = []
	if (skipAlreadyInvited) {
		try {
			const attendees = await getGoogleCalendarEventAttendees(calendarId)
			// Filter out the event host email from existing attendees
			const filteredAttendees =
				attendees?.filter((a) => a.email !== EVENT_HOST_EMAIL) || []
			existingAttendees = filteredAttendees.map((a) => a.email)

			await log.info('calendar.invite.existing_attendees_checked', {
				calendarId,
				existingAttendeesCount: existingAttendees.length,
			})
		} catch (error) {
			await log.warn('calendar.invite.failed_to_check_existing_attendees', {
				calendarId,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	}

	for (const purchaser of purchasers) {
		// Skip if already invited and we're in skip mode
		if (skipAlreadyInvited && existingAttendees.includes(purchaser.email)) {
			eventResult.purchaserResults.push({
				email: purchaser.email,
				success: true,
				skipped: true,
				reason: 'Already invited to this event',
			})

			await log.info('calendar.invite.user_skipped', {
				calendarId,
				userEmail: purchaser.email,
				userName: purchaser.name,
				reason: 'Already invited',
			})
			continue
		}

		try {
			await addUserToGoogleCalendarEvent(calendarId, purchaser.email)
			eventResult.purchaserResults.push({
				email: purchaser.email,
				success: true,
			})

			await log.info('calendar.invite.user_added', {
				calendarId,
				userEmail: purchaser.email,
				userName: purchaser.name,
			})
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			eventResult.purchaserResults.push({
				email: purchaser.email,
				success: false,
				error: errorMessage,
			})

			await log.error('calendar.invite.user_failed', {
				calendarId,
				userEmail: purchaser.email,
				userName: purchaser.name,
				error: errorMessage,
			})
		}
	}
}

/**
 * Sends calendar invites only to purchasers who haven't been invited yet (Phase 2 functionality)
 */
export async function sendCalendarInvitesToNewPurchasersOnly(
	productId: string,
): Promise<{
	success: boolean
	message: string
	results?: {
		totalPurchasers: number
		totalEvents: number
		successfulInvites: number
		failedInvites: number
		skippedInvites: number
		details: Array<{
			eventTitle: string
			eventId: string
			calendarId?: string
			purchaserResults: Array<{
				email: string
				success: boolean
				error?: string
				skipped?: boolean
				reason?: string
			}>
		}>
	}
}> {
	const { ability } = await getServerAuthSession()

	if (!ability.can('update', 'Content')) {
		return {
			success: false,
			message: 'Unauthorized to send calendar invites',
		}
	}

	try {
		await log.info('calendar.invite.new_only_started', {
			productId,
			action: 'send_calendar_invites_to_new_purchasers_only',
		})

		// Get product and validate it's a cohort
		const product = await getProduct(productId)
		if (!product) {
			return {
				success: false,
				message: 'Product not found',
			}
		}

		if (product.type !== 'cohort') {
			return {
				success: false,
				message: 'Product is not a cohort type',
			}
		}

		// Get office hours events associated with the product
		const officeHoursEvents = await getProductOfficeHoursEvents(product.id)

		if (officeHoursEvents.length === 0) {
			return {
				success: false,
				message: 'No office hours events found for this cohort product',
			}
		}

		// Get all purchasers of the product
		const purchaseData = await getProductPurchaseData({
			productIds: [product.id],
			limit: 1000, // Get all purchasers
			offset: 0,
		})

		if (purchaseData.data.length === 0) {
			return {
				success: false,
				message: 'No purchasers found for this product',
			}
		}

		await log.info('calendar.invite.new_only_processing', {
			productId,
			productName: product.name,
			totalPurchasers: purchaseData.data.length,
			totalOfficeHoursEvents: officeHoursEvents.length,
		})

		let successfulInvites = 0
		let failedInvites = 0
		let skippedInvites = 0
		const eventResults = []

		// Process each office hours event
		for (const event of officeHoursEvents) {
			const eventResult = {
				eventTitle: event.fields?.title || 'Untitled Event',
				eventId: event.id,
				calendarId: undefined as string | undefined,
				purchaserResults: [] as Array<{
					email: string
					success: boolean
					error?: string
					skipped?: boolean
					reason?: string
				}>,
			}

			// Handle both single events and event series
			if (event.type === 'event-series' && event.resources) {
				// Process each child event in the series
				for (const { resource: childEvent } of event.resources) {
					if (
						childEvent?.type === 'event' &&
						'calendarId' in childEvent.fields &&
						childEvent.fields.calendarId
					) {
						await processEventInvites(
							childEvent.fields.calendarId as string,
							purchaseData.data,
							eventResult,
							true, // Skip already invited users
						)
					}
				}
			} else if (
				event.type === 'event' &&
				'calendarId' in event.fields &&
				event.fields.calendarId
			) {
				// Single event
				eventResult.calendarId = event.fields.calendarId as string
				await processEventInvites(
					event.fields.calendarId as string,
					purchaseData.data,
					eventResult,
					true, // Skip already invited users
				)
			}

			// Count successes, failures, and skips for this event
			const eventSuccesses = eventResult.purchaserResults.filter(
				(r) => r.success && !r.skipped,
			).length
			const eventFailures = eventResult.purchaserResults.filter(
				(r) => !r.success,
			).length
			const eventSkips = eventResult.purchaserResults.filter(
				(r) => r.skipped,
			).length

			successfulInvites += eventSuccesses
			failedInvites += eventFailures
			skippedInvites += eventSkips

			eventResults.push(eventResult)
		}

		await log.info('calendar.invite.new_only_completed', {
			productId,
			productName: product.name,
			totalPurchasers: purchaseData.data.length,
			totalEvents: officeHoursEvents.length,
			successfulInvites,
			failedInvites,
			skippedInvites,
		})

		revalidatePath(`/products/${product.fields?.slug || product.id}`)

		return {
			success: true,
			message: `Successfully processed calendar invites. ${successfulInvites} new invites sent, ${skippedInvites} already invited, ${failedInvites} failed.`,
			results: {
				totalPurchasers: purchaseData.data.length,
				totalEvents: officeHoursEvents.length,
				successfulInvites,
				failedInvites,
				skippedInvites,
				details: eventResults,
			},
		}
	} catch (error) {
		await log.error('calendar.invite.new_only_error', {
			productId,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})

		return {
			success: false,
			message: `Failed to send calendar invites: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`,
		}
	}
}

/**
 * Determines if an event is an office hours event based on title or tags
 * This is not currently used, but keeping for reference
 */
function isOfficeHoursEvent(event: any): boolean {
	// Check title for "office hours" keywords
	const titleLower = event.fields?.title?.toLowerCase() || ''
	if (
		titleLower.includes('office hours') ||
		titleLower.includes('office hour')
	) {
		return true
	}

	// Check tags for office hours
	if (event.tags && Array.isArray(event.tags)) {
		return event.tags.some((tagItem: any) => {
			const tagName = tagItem.tag?.fields?.name?.toLowerCase() || ''
			return tagName.includes('office hours') || tagName.includes('office hour')
		})
	}

	return false
}
