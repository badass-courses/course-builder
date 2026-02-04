'use server'

import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { shortlink, shortlinkAttribution, shortlinkClick } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { redis } from '@/server/redis-client'
import { and, count, desc, eq, like, or, sql } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'

import {
	CreateShortlinkSchema,
	UpdateShortlinkSchema,
	type CreateShortlinkInput,
	type RecentClickStats,
	type Shortlink,
	type ShortlinkAnalytics,
	type ShortlinkAttributionData,
	type ShortlinkClickEvent,
	type ShortlinkWithAttributions,
	type UpdateShortlinkInput,
} from './shortlinks-types'

const nanoid = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	6,
)

const REDIS_KEY_PREFIX = 'shortlink:'

/**
 * Get all shortlinks with optional search filter
 */
export async function getShortlinks(search?: string): Promise<Shortlink[]> {
	const { ability } = await getServerAuthSession()
	if (!ability.can('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	const links = await db.query.shortlink.findMany({
		where: search
			? or(
					like(shortlink.slug, `%${search}%`),
					like(shortlink.url, `%${search}%`),
					like(shortlink.description, `%${search}%`),
				)
			: undefined,
		orderBy: desc(shortlink.createdAt),
	})

	return links
}

/**
 * Get all shortlinks with attribution counts
 */
export async function getShortlinksWithAttributions(
	search?: string,
): Promise<ShortlinkWithAttributions[]> {
	const { ability } = await getServerAuthSession()
	if (!ability.can('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	// Get shortlinks with attribution counts using LEFT JOIN and GROUP BY
	// (correlated subqueries with drizzle sql template don't correlate properly)
	const links = await db
		.select({
			id: shortlink.id,
			slug: shortlink.slug,
			url: shortlink.url,
			description: shortlink.description,
			clicks: shortlink.clicks,
			createdAt: shortlink.createdAt,
			updatedAt: shortlink.updatedAt,
			createdById: shortlink.createdById,
			signups:
				sql<number>`COALESCE(SUM(CASE WHEN ${shortlinkAttribution.type} = 'signup' THEN 1 ELSE 0 END), 0)`
					.mapWith(Number)
					.as('signups'),
			purchases:
				sql<number>`COALESCE(SUM(CASE WHEN ${shortlinkAttribution.type} = 'purchase' THEN 1 ELSE 0 END), 0)`
					.mapWith(Number)
					.as('purchases'),
		})
		.from(shortlink)
		.leftJoin(
			shortlinkAttribution,
			eq(shortlink.id, shortlinkAttribution.shortlinkId),
		)
		.where(
			search
				? or(
						like(shortlink.slug, `%${search}%`),
						like(shortlink.url, `%${search}%`),
						like(shortlink.description, `%${search}%`),
					)
				: undefined,
		)
		.groupBy(
			shortlink.id,
			shortlink.slug,
			shortlink.url,
			shortlink.description,
			shortlink.clicks,
			shortlink.createdAt,
			shortlink.updatedAt,
			shortlink.createdById,
		)
		.orderBy(desc(shortlink.createdAt))

	return links
}

/**
 * Get a single shortlink by ID
 */
export async function getShortlinkById(id: string): Promise<Shortlink | null> {
	const { ability } = await getServerAuthSession()
	if (!ability.can('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	const link = await db.query.shortlink.findFirst({
		where: eq(shortlink.id, id),
	})

	return link ?? null
}

/**
 * Get a shortlink by slug (for redirect - no auth required)
 * Uses Redis cache first, falls back to DB
 */
export async function getShortlinkBySlug(
	slug: string,
): Promise<Shortlink | null> {
	// Try Redis cache first
	const cachedLink = await redis.get<Shortlink>(`${REDIS_KEY_PREFIX}${slug}`)
	if (cachedLink) {
		await log.info('shortlink.cache.hit', { slug })
		return cachedLink
	}

	// Fallback to database
	const link = await db.query.shortlink.findFirst({
		where: eq(shortlink.slug, slug),
	})

	if (link) {
		// Cache full object for future lookups
		await redis.set(`${REDIS_KEY_PREFIX}${slug}`, link)
		await log.info('shortlink.cache.miss', { slug, cached: true })
	}

	return link ?? null
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
	const existing = await db.query.shortlink.findFirst({
		where: eq(shortlink.slug, slug),
	})
	return !existing
}

/**
 * Generate a unique slug
 */
export async function generateUniqueSlug(): Promise<string> {
	let slug = nanoid()
	let attempts = 0
	const maxAttempts = 10

	while (!(await isSlugAvailable(slug)) && attempts < maxAttempts) {
		slug = nanoid()
		attempts++
	}

	if (attempts >= maxAttempts) {
		throw new Error('Failed to generate unique slug')
	}

	return slug
}

/**
 * Create a new shortlink
 */
export async function createShortlink(
	input: CreateShortlinkInput,
): Promise<Shortlink> {
	const { session, ability } = await getServerAuthSession()
	if (!ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const parsed = CreateShortlinkSchema.parse(input)

	// Generate slug if not provided
	const slug = parsed.slug || (await generateUniqueSlug())

	// Check slug availability
	// Note: Database unique constraint provides final protection against race conditions
	if (parsed.slug && !(await isSlugAvailable(slug))) {
		throw new Error('Slug already exists')
	}

	let insertedId: string | undefined
	try {
		const results = await db
			.insert(shortlink)
			.values({
				slug,
				url: parsed.url,
				description: parsed.description,
				createdById: session?.user?.id,
			})
			.$returningId()

		insertedId = results[0]?.id
	} catch (error) {
		// Handle unique constraint violation (race condition protection)
		if (
			error instanceof Error &&
			(error.message.includes('Duplicate entry') ||
				error.message.includes('UNIQUE constraint') ||
				error.message.includes('already exists'))
		) {
			throw new Error('Slug already exists')
		}
		throw error
	}

	if (!insertedId) {
		throw new Error('Failed to insert shortlink')
	}

	await log.info('shortlink.created', { slug, url: parsed.url })

	const link = await getShortlinkById(insertedId)
	if (!link) {
		throw new Error('Failed to create shortlink')
	}

	// Cache full object in Redis
	await redis.set(`${REDIS_KEY_PREFIX}${slug}`, link)

	revalidateTag('shortlinks', 'max')

	return link
}

/**
 * Update an existing shortlink
 */
export async function updateShortlink(
	input: UpdateShortlinkInput,
): Promise<Shortlink> {
	const { ability } = await getServerAuthSession()
	if (!ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const parsed = UpdateShortlinkSchema.parse(input)

	const existing = await db.query.shortlink.findFirst({
		where: eq(shortlink.id, parsed.id),
	})

	if (!existing) {
		throw new Error('Shortlink not found')
	}

	// Check slug availability if changing
	// Note: Database unique constraint provides final protection against race conditions
	if (parsed.slug && parsed.slug !== existing.slug) {
		if (!(await isSlugAvailable(parsed.slug))) {
			throw new Error('Slug already exists')
		}
	}

	try {
		await db
			.update(shortlink)
			.set({
				slug: parsed.slug ?? existing.slug,
				url: parsed.url ?? existing.url,
				description: parsed.description ?? existing.description,
				updatedAt: new Date(),
			})
			.where(eq(shortlink.id, parsed.id))
	} catch (error) {
		// Handle unique constraint violation (race condition protection)
		if (
			error instanceof Error &&
			(error.message.includes('Duplicate entry') ||
				error.message.includes('UNIQUE constraint') ||
				error.message.includes('already exists'))
		) {
			throw new Error('Slug already exists')
		}
		throw error
	}

	const newSlug = parsed.slug ?? existing.slug

	// Remove old cache if slug changed
	if (parsed.slug && parsed.slug !== existing.slug) {
		await redis.del(`${REDIS_KEY_PREFIX}${existing.slug}`)
	}

	await log.info('shortlink.updated', {
		id: parsed.id,
		slug: newSlug,
		url: parsed.url ?? existing.url,
	})

	revalidateTag('shortlinks', 'max')

	const updated = await getShortlinkById(parsed.id)
	if (!updated) {
		throw new Error('Failed to update shortlink')
	}

	// Cache full updated object in Redis
	await redis.set(`${REDIS_KEY_PREFIX}${newSlug}`, updated)

	return updated
}

/**
 * Delete a shortlink
 */
export async function deleteShortlink(id: string): Promise<void> {
	const { ability } = await getServerAuthSession()
	if (!ability.can('delete', 'Content')) {
		throw new Error('Unauthorized')
	}

	const existing = await db.query.shortlink.findFirst({
		where: eq(shortlink.id, id),
	})

	if (!existing) {
		throw new Error('Shortlink not found')
	}

	// Delete clicks first (manual cascade since PlanetScale doesn't support FKs)
	await db.delete(shortlinkClick).where(eq(shortlinkClick.shortlinkId, id))

	// Delete attributions
	await db
		.delete(shortlinkAttribution)
		.where(eq(shortlinkAttribution.shortlinkId, id))

	// Delete from database
	await db.delete(shortlink).where(eq(shortlink.id, id))

	// Remove from Redis
	await redis.del(`${REDIS_KEY_PREFIX}${existing.slug}`)

	await log.info('shortlink.deleted', { id, slug: existing.slug })

	revalidateTag('shortlinks', 'max')
}

/**
 * Record a click event for a shortlink
 * This is called asynchronously from the redirect handler
 */
export async function recordClick(
	slug: string,
	metadata: {
		referrer?: string | null
		userAgent?: string | null
		country?: string | null
		device?: string | null
	},
): Promise<void> {
	try {
		const link = await db.query.shortlink.findFirst({
			where: eq(shortlink.slug, slug),
		})

		if (!link) {
			await log.warn('shortlink.click.notfound', { slug })
			return
		}

		// Increment click counter
		await db
			.update(shortlink)
			.set({
				clicks: sql`${shortlink.clicks} + 1`,
			})
			.where(eq(shortlink.id, link.id))

		// Insert click event
		await db.insert(shortlinkClick).values({
			shortlinkId: link.id,
			referrer: metadata.referrer ?? undefined,
			userAgent: metadata.userAgent ?? undefined,
			country: metadata.country ?? undefined,
			device: metadata.device ?? undefined,
		})

		await log.info('shortlink.click.recorded', {
			slug,
			referrer: metadata.referrer,
		})
	} catch (error) {
		await log.error('shortlink.click.error', { slug, error: String(error) })
	}
}

/**
 * Get analytics for a shortlink
 */
export async function getShortlinkAnalytics(
	id: string,
): Promise<ShortlinkAnalytics> {
	const { ability } = await getServerAuthSession()
	if (!ability.can('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	const link = await db.query.shortlink.findFirst({
		where: eq(shortlink.id, id),
	})

	if (!link) {
		throw new Error('Shortlink not found')
	}

	// Get clicks by day (last 30 days)
	const clicksByDayQuery = await db
		.select({
			date: sql<string>`DATE(${shortlinkClick.timestamp})`.as('date'),
			clicks: count().as('clicks'),
		})
		.from(shortlinkClick)
		.where(
			and(
				eq(shortlinkClick.shortlinkId, id),
				sql`${shortlinkClick.timestamp} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
			),
		)
		.groupBy(sql`DATE(${shortlinkClick.timestamp})`)
		.orderBy(sql`DATE(${shortlinkClick.timestamp})`)

	// Get top referrers
	const topReferrersQuery = await db
		.select({
			referrer: sql<string>`COALESCE(${shortlinkClick.referrer}, 'Direct')`.as(
				'referrer',
			),
			clicks: count().as('clicks'),
		})
		.from(shortlinkClick)
		.where(eq(shortlinkClick.shortlinkId, id))
		.groupBy(shortlinkClick.referrer)
		.orderBy(desc(count()))
		.limit(10)

	// Get device breakdown
	const deviceBreakdownQuery = await db
		.select({
			device: sql<string>`COALESCE(${shortlinkClick.device}, 'Unknown')`.as(
				'device',
			),
			clicks: count().as('clicks'),
		})
		.from(shortlinkClick)
		.where(eq(shortlinkClick.shortlinkId, id))
		.groupBy(shortlinkClick.device)
		.orderBy(desc(count()))

	// Get recent clicks
	const recentClicksQuery = await db.query.shortlinkClick.findMany({
		where: eq(shortlinkClick.shortlinkId, id),
		orderBy: desc(shortlinkClick.timestamp),
		limit: 50,
	})

	return {
		totalClicks: link.clicks,
		clicksByDay: clicksByDayQuery,
		topReferrers: topReferrersQuery,
		deviceBreakdown: deviceBreakdownQuery,
		recentClicks: recentClicksQuery,
	}
}

/**
 * Get click counts for the last 60 minutes and 24 hours
 */
export async function getRecentClickStats(): Promise<RecentClickStats> {
	const { ability } = await getServerAuthSession()
	if (!ability.can('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	const [last60MinutesResult, last24HoursResult] = await Promise.all([
		db
			.select({ count: count() })
			.from(shortlinkClick)
			.where(
				sql`${shortlinkClick.timestamp} >= DATE_SUB(NOW(), INTERVAL 60 MINUTE)`,
			),
		db
			.select({ count: count() })
			.from(shortlinkClick)
			.where(
				sql`${shortlinkClick.timestamp} >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
			),
	])

	return {
		last60Minutes: last60MinutesResult[0]?.count ?? 0,
		last24Hours: last24HoursResult[0]?.count ?? 0,
	}
}

// Re-export from separate file to avoid circular dependency
// (email-provider → shortlinks-query → auth → email-provider)
export { createShortlinkAttribution } from './shortlink-attribution'
