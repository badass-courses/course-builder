import { NextResponse } from 'next/server'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { env } from '@/env.mjs'

/**
 * sitemap.md - AI agent discovery endpoint
 * Returns markdown index of free public content with instructions for markdown negotiation
 */
export async function GET() {
	const baseUrl = env.COURSEBUILDER_URL || env.NEXT_PUBLIC_URL

	// Fetch workshops and tutorials with nested structure
	const workshopItems = await db.execute(sql`
    SELECT DISTINCT
      workshop.id AS workshop_id,
      workshop.type AS workshop_type,
      workshop.fields->>'$.slug' AS workshop_slug,
      workshop.fields->>'$.title' AS workshop_title,
      COALESCE(sections.id, top_level_lessons.id) AS section_or_lesson_id,
      COALESCE(sections.fields->>'$.slug', top_level_lessons.fields->>'$.slug') AS section_or_lesson_slug,
      COALESCE(sections.fields->>'$.title', top_level_lessons.fields->>'$.title') AS section_or_lesson_title,
      CASE
        WHEN COALESCE(sections.id, top_level_lessons.id) IS NULL THEN workshop.type
        WHEN lessons.id IS NULL THEN top_level_lessons.type
        ELSE lessons.type
      END AS item_type,
      lessons.id AS lesson_id,
      lessons.fields->>'$.slug' AS lesson_slug,
      lessons.fields->>'$.title' AS lesson_title,
      COALESCE(lesson_relations.metadata->>'$.tier', section_relations.metadata->>'$.tier', top_level_lesson_relations.metadata->>'$.tier') AS tier
    FROM ${contentResource} AS workshop
    LEFT JOIN ${contentResourceResource} AS section_relations
      ON workshop.id = section_relations.resourceOfId
    LEFT JOIN ${contentResource} AS sections
      ON sections.id = section_relations.resourceId AND sections.type = 'section'
    LEFT JOIN ${contentResourceResource} AS lesson_relations
      ON sections.id = lesson_relations.resourceOfId
    LEFT JOIN ${contentResource} AS lessons
      ON lessons.id = lesson_relations.resourceId AND (lessons.type = 'lesson' OR lessons.type = 'exercise')
    LEFT JOIN ${contentResourceResource} AS top_level_lesson_relations
      ON workshop.id = top_level_lesson_relations.resourceOfId
    LEFT JOIN ${contentResource} AS top_level_lessons
      ON top_level_lessons.id = top_level_lesson_relations.resourceId
      AND (top_level_lessons.type = 'lesson' OR top_level_lessons.type = 'exercise')
    WHERE
      (workshop.type = 'workshop' OR workshop.type = 'tutorial')
      AND workshop.fields->>'$.state' = 'published'
      AND workshop.fields->>'$.visibility' = 'public'
  `)

	// Fetch posts and lists
	const otherContent = await db.execute(sql`
    SELECT
      cr.type,
      cr.fields->>'$.slug' AS slug,
      cr.fields->>'$.title' AS title
    FROM ${contentResource} cr
    WHERE
      cr.type IN ('post', 'list')
      AND cr.fields->>'$.state' = 'published'
      AND cr.fields->>'$.visibility' = 'public'
      AND cr.deletedAt IS NULL
    ORDER BY cr.type, cr.updatedAt DESC
  `)

	const freeContent: Array<{ title: string; url: string; type: string }> = []

	// Add posts and lists
	otherContent.rows.forEach((item: any) => {
		freeContent.push({
			title: item.title,
			url: `${baseUrl}/${item.slug}`,
			type: item.type,
		})
	})

	// Add free workshop/tutorial lessons
	const processedWorkshops = new Set<string>()
	workshopItems.rows.forEach((item: any) => {
		const workshopSlug = item.workshop_slug
		const workshopType = item.workshop_type
		if (!processedWorkshops.has(item.workshop_id)) {
			processedWorkshops.add(item.workshop_id)
		}

		// Only include lessons marked as free tier
		if (
			(item.item_type === 'lesson' || item.item_type === 'exercise') &&
			item.tier === 'free'
		) {
			const lessonSlug = item.lesson_slug || item.section_or_lesson_slug
			if (lessonSlug) {
				freeContent.push({
					title: `${item.workshop_title}: ${item.lesson_title || item.section_or_lesson_title}`,
					url: `${baseUrl}/${workshopType}s/${workshopSlug}/${lessonSlug}`,
					type: 'lesson',
				})
			}
		}
	})

	const md = `# AI Hero Content Index

> Request any URL with \`Accept: text/markdown\` header for markdown version.

Updated: ${new Date().toISOString()}

## Free Content

${freeContent.map((c) => `- [${c.title}](${c.url}) (${c.type})`).join('\n')}

## Usage

\`\`\`bash
# Get markdown version of any post or lesson
curl -H "Accept: text/markdown" ${baseUrl}/some-post-slug

# Workshop/tutorial lessons
curl -H "Accept: text/markdown" ${baseUrl}/workshops/module-slug/lesson-slug
curl -H "Accept: text/markdown" ${baseUrl}/tutorials/module-slug/lesson-slug
\`\`\`

## Routes

- Posts/Lists: \`/${baseUrl}/<slug>\`
- Workshops: \`${baseUrl}/workshops/<module>/<lesson>\`
- Tutorials: \`${baseUrl}/tutorials/<module>/<lesson>\`
`

	return new NextResponse(md, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
		},
	})
}
