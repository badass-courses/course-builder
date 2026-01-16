import { shortlink, shortlinkClick } from '@/db/schema'
import { z } from 'zod'

/**
 * Schema for creating a shortlink
 */
export const CreateShortlinkSchema = z.object({
	slug: z
		.string()
		.min(1)
		.max(50)
		.regex(/^[a-zA-Z0-9_-]+$/)
		.optional(),
	url: z.string().url(),
	description: z.string().max(255).optional(),
})

export type CreateShortlinkInput = z.infer<typeof CreateShortlinkSchema>

/**
 * Schema for updating a shortlink
 */
export const UpdateShortlinkSchema = z.object({
	id: z.string(),
	slug: z
		.string()
		.min(1)
		.max(50)
		.regex(/^[a-zA-Z0-9_-]+$/)
		.optional(),
	url: z.string().url().optional(),
	description: z.string().max(255).optional(),
})

export type UpdateShortlinkInput = z.infer<typeof UpdateShortlinkSchema>

/**
 * Shortlink type from database
 */
export type Shortlink = typeof shortlink.$inferSelect

/**
 * Shortlink click event type
 */
export type ShortlinkClickEvent = typeof shortlinkClick.$inferSelect

/**
 * Shortlink with attribution counts
 */
export type ShortlinkWithAttributions = Shortlink & {
	signups: number
	purchases: number
}

/**
 * Analytics data for a shortlink
 */
export interface ShortlinkAnalytics {
	totalClicks: number
	clicksByDay: { date: string; clicks: number }[]
	topReferrers: { referrer: string; clicks: number }[]
	deviceBreakdown: { device: string; clicks: number }[]
	recentClicks: ShortlinkClickEvent[]
}

/**
 * Recent click stats across all shortlinks
 */
export interface RecentClickStats {
	last60Minutes: number
	last24Hours: number
}

/**
 * Attribution data type
 */
export type ShortlinkAttributionData = {
	shortlinkSlug: string
	email: string
	userId?: string
	type: 'signup' | 'purchase'
	metadata?: Record<string, unknown>
}
