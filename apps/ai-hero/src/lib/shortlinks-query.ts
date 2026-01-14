'use server'

import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { shortlink, shortlinkClick } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { redis } from '@/server/redis-client'
import { and, count, desc, eq, like, or, sql } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'

import {
	CreateShortlinkInput,
	CreateShortlinkSchema,
	Shortlink,
	ShortlinkAnalytics,
	UpdateShortlinkInput,
	UpdateShortlinkSchema,
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
	const cachedUrl = await redis.get<string>(`${REDIS_KEY_PREFIX}${slug}`)
	if (cachedUrl) {
		await log.info('shortlink.cache.hit', { slug })
		// Return minimal data for redirect
		const link = await db.query.shortlink.findFirst({
			where: eq(shortlink.slug, slug),
		})
		return link ?? null
	}

	// Fallback to database
	const link = await db.query.shortlink.findFirst({
		where: eq(shortlink.slug, slug),
	})

	if (link) {
		// Cache for future lookups
		await redis.set(`${REDIS_KEY_PREFIX}${slug}`, link.url)
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
	if (parsed.slug && !(await isSlugAvailable(slug))) {
		throw new Error('Slug already exists')
	}

	const results = await db
		.insert(shortlink)
		.values({
			slug,
			url: parsed.url,
			description: parsed.description,
			createdById: session?.user?.id,
		})
		.$returningId()

	const insertedId = results[0]?.id
	if (!insertedId) {
		throw new Error('Failed to insert shortlink')
	}

	// Cache in Redis
	await redis.set(`${REDIS_KEY_PREFIX}${slug}`, parsed.url)

	await log.info('shortlink.created', { slug, url: parsed.url })

	const link = await getShortlinkById(insertedId)
	if (!link) {
		throw new Error('Failed to create shortlink')
	}

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
	if (parsed.slug && parsed.slug !== existing.slug) {
		if (!(await isSlugAvailable(parsed.slug))) {
			throw new Error('Slug already exists')
		}
	}

	await db
		.update(shortlink)
		.set({
			slug: parsed.slug ?? existing.slug,
			url: parsed.url ?? existing.url,
			description: parsed.description ?? existing.description,
			updatedAt: new Date(),
		})
		.where(eq(shortlink.id, parsed.id))

	// Update Redis cache
	const newSlug = parsed.slug ?? existing.slug
	const newUrl = parsed.url ?? existing.url

	// Remove old cache if slug changed
	if (parsed.slug && parsed.slug !== existing.slug) {
		await redis.del(`${REDIS_KEY_PREFIX}${existing.slug}`)
	}

	// Set new cache
	await redis.set(`${REDIS_KEY_PREFIX}${newSlug}`, newUrl)

	await log.info('shortlink.updated', {
		id: parsed.id,
		slug: newSlug,
		url: newUrl,
	})

	revalidateTag('shortlinks', 'max')

	const updated = await getShortlinkById(parsed.id)
	if (!updated) {
		throw new Error('Failed to update shortlink')
	}

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
