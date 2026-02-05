import { db } from '@/db'
import { shortlink, shortlinkAttribution } from '@/db/schema'
import { log } from '@/server/logger'
import { and, eq } from 'drizzle-orm'

import { guid } from '@coursebuilder/utils-core/guid'

import type { ShortlinkAttributionData } from './shortlinks-types'

/**
 * Records attribution when a user signs up or makes a purchase via a shortlink.
 *
 * Extracted to separate file to avoid circular dependency:
 * email-provider → shortlinks-query → auth → email-provider
 */
export async function createShortlinkAttribution(
	data: ShortlinkAttributionData,
): Promise<void> {
	try {
		// Look up shortlink by slug
		const link = await db.query.shortlink.findFirst({
			where: eq(shortlink.slug, data.shortlinkSlug),
		})

		if (!link) {
			await log.warn('shortlink.attribution.notfound', {
				slug: data.shortlinkSlug,
			})
			return
		}

		// Only dedupe signups - purchases should be recorded every time
		// (user may buy multiple products via the same shortlink)
		if (data.type === 'signup') {
			const existing = await db.query.shortlinkAttribution.findFirst({
				where: and(
					eq(shortlinkAttribution.shortlinkId, link.id),
					eq(shortlinkAttribution.email, data.email),
					eq(shortlinkAttribution.type, data.type),
				),
			})

			if (existing) {
				await log.info('shortlink.attribution.duplicate', {
					slug: data.shortlinkSlug,
					userId: data.userId,
					type: data.type,
				})
				return
			}
		}

		// Insert attribution record
		await db.insert(shortlinkAttribution).values({
			id: guid(),
			shortlinkId: link.id,
			userId: data.userId,
			email: data.email,
			type: data.type,
			metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
		})

		await log.info('shortlink.attribution.recorded', {
			slug: data.shortlinkSlug,
			userId: data.userId,
			type: data.type,
		})
	} catch (error) {
		await log.error('shortlink.attribution.error', {
			slug: data.shortlinkSlug,
			error: String(error),
		})
	}
}
