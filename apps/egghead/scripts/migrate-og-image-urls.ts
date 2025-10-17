#!/usr/bin/env tsx
/**
 * Migration Script: Update OG Image URLs from Query Param to Dynamic Route
 *
 * This script updates any custom OG image URLs stored in the database
 * from the old format (/api/og?resource=...) to the new format (/api/og/...)
 *
 * Usage:
 *   pnpm tsx scripts/migrate-og-image-urls.ts [--dry-run]
 */
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

const isDryRun = process.argv.includes('--dry-run')

async function migrateOgImageUrls() {
	console.log('🔍 Searching for posts with old OG image URLs...\n')

	// Find all posts with custom ogImage fields
	const posts = await db.query.contentResource.findMany({
		where: sql`JSON_EXTRACT(${contentResource.fields}, "$.ogImage") IS NOT NULL`,
	})

	console.log(`Found ${posts.length} posts with custom OG images\n`)

	let updatedCount = 0
	let skippedCount = 0

	for (const post of posts) {
		const ogImage = post.fields?.ogImage

		if (!ogImage || typeof ogImage !== 'string') {
			continue
		}

		// Check if it's using the old format
		const oldFormatRegex = /\/api\/og\?resource=([^&]+)(&.*)?$/
		const match = ogImage.match(oldFormatRegex)

		if (match) {
			const resourceSlug = match[1]
			const queryParams = match[2] || ''
			const newUrl = `/api/og/${resourceSlug}${queryParams.replace('&', '?')}`

			console.log(`📝 Post: ${post.fields?.title || post.id}`)
			console.log(`   Old: ${ogImage}`)
			console.log(`   New: ${newUrl}`)

			if (!isDryRun) {
				// Update the database
				await db
					.update(contentResource)
					.set({
						fields: {
							...post.fields,
							ogImage: newUrl,
						},
					})
					.where(eq(contentResource.id, post.id))

				console.log(`   ✅ Updated\n`)
				updatedCount++
			} else {
				console.log(`   🔍 Would update (dry-run)\n`)
				updatedCount++
			}
		} else if (ogImage.includes('/api/og/')) {
			// Already using new format
			console.log(`⏭️  Post: ${post.fields?.title || post.id}`)
			console.log(`   Already using new format: ${ogImage}\n`)
			skippedCount++
		} else {
			// External or different URL format
			console.log(`⚠️  Post: ${post.fields?.title || post.id}`)
			console.log(`   External/custom URL: ${ogImage}\n`)
			skippedCount++
		}
	}

	console.log('\n' + '='.repeat(60))
	console.log('📊 Migration Summary')
	console.log('='.repeat(60))
	console.log(`Total posts checked: ${posts.length}`)
	console.log(
		`Posts ${isDryRun ? 'to be updated' : 'updated'}: ${updatedCount}`,
	)
	console.log(`Posts skipped: ${skippedCount}`)
	console.log(
		`Mode: ${isDryRun ? '🔍 DRY RUN (no changes made)' : '✅ LIVE (changes applied)'}`,
	)
	console.log('='.repeat(60) + '\n')

	if (isDryRun && updatedCount > 0) {
		console.log(
			'💡 Run without --dry-run flag to apply changes:\n   pnpm tsx scripts/migrate-og-image-urls.ts\n',
		)
	}
}

migrateOgImageUrls()
	.then(() => {
		console.log('✨ Migration complete!')
		process.exit(0)
	})
	.catch((error) => {
		console.error('❌ Migration failed:', error)
		process.exit(1)
	})
