import { z } from 'zod'

/**
 * Zod schemas for calendar invite status with runtime validation
 */
export const CalendarEventInfoSchema = z.object({
	calendarId: z.string(),
	eventTitle: z.string(),
	attendeeCount: z.number().int().min(0),
	attendeeEmails: z.array(z.string().email()),
})

export const EventInviteStatusSchema = z.object({
	eventId: z.string(),
	eventTitle: z.string(),
	eventType: z.enum(['event', 'event-series']),
	calendarEvents: z.array(CalendarEventInfoSchema),
	totalAttendees: z.number().int().min(0),
	uniqueAttendeeEmails: z.array(z.string().email()),
})

export const InviteComparisonSchema = z.object({
	totalUniqueInvited: z.number().int().min(0),
	notInvited: z.array(z.string().email()),
	invitedButNotPurchased: z.array(z.string().email()),
	inviteRate: z.number().int().min(0).max(100), // percentage of purchasers who have been invited
})

export const ProductEventInviteStatusSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	events: z.array(EventInviteStatusSchema),
	totalPurchasers: z.number().int().min(0),
	purchaserEmails: z.array(z.string().email()),
	inviteComparison: InviteComparisonSchema,
})

// Export the inferred types
export type CalendarEventInfo = z.infer<typeof CalendarEventInfoSchema>
export type EventInviteStatus = z.infer<typeof EventInviteStatusSchema>
export type InviteComparison = z.infer<typeof InviteComparisonSchema>
export type ProductEventInviteStatus = z.infer<
	typeof ProductEventInviteStatusSchema
>
