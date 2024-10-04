import { MetadataRoute } from 'next'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const workshopItems = await db.execute(sql`
    SELECT DISTINCT
      workshop.id AS workshop_id,
      workshop.type AS workshop_type,
      workshop.fields->>'$.slug' AS workshop_slug,
      workshop.fields->>'$.title' AS workshop_title,
      COALESCE(sections.id, top_level_lessons.id) AS section_or_lesson_id,
      COALESCE(sections.fields->>'$.slug', top_level_lessons.fields->>'$.slug') AS section_or_lesson_slug,
      COALESCE(sections.fields->>'$.title', top_level_lessons.fields->>'$.title') AS section_or_lesson_title,
      COALESCE(section_relations.position, top_level_lesson_relations.position) AS section_or_lesson_position,
      CASE
          WHEN COALESCE(sections.id, top_level_lessons.id) IS NULL THEN workshop.type
          WHEN lessons.id IS NULL THEN top_level_lessons.\`type\`
          ELSE lessons.\`type\`
      END AS item_type,
      lessons.id AS lesson_id,
      lessons.fields->>'$.slug' AS lesson_slug,
      lessons.fields->>'$.title' AS lesson_title,
      lesson_relations.position AS lesson_position
    FROM
      ContentResource AS workshop
    LEFT JOIN ContentResourceResource AS section_relations
      ON workshop.id = section_relations.resourceOfId
    LEFT JOIN ContentResource AS sections
      ON sections.id = section_relations.resourceId AND sections.type = 'section'
    LEFT JOIN ContentResourceResource AS lesson_relations
      ON sections.id = lesson_relations.resourceOfId
    LEFT JOIN ContentResource AS lessons
      ON lessons.id = lesson_relations.resourceId AND (lessons.type = 'lesson' OR lessons.type = 'exercise')
    LEFT JOIN ContentResourceResource AS top_level_lesson_relations
      ON workshop.id = top_level_lesson_relations.resourceOfId
    LEFT JOIN ContentResource AS top_level_lessons
      ON top_level_lessons.id = top_level_lesson_relations.resourceId
      AND (top_level_lessons.type = 'lesson' OR top_level_lessons.type = 'exercise')
    WHERE
      workshop.type = 'workshop' or workshop.\`type\` = 'tutorial'
    ORDER BY
      COALESCE(section_relations.position, top_level_lesson_relations.position),
      lesson_relations.position
  `)

	const sitemapEntries: MetadataRoute.Sitemap = []

	// Add workshop and tutorial entries
	const workshopsAndTutorials = new Set<string>()
	workshopItems.rows.forEach((item: any) => {
		if (!workshopsAndTutorials.has(item.workshop_id)) {
			workshopsAndTutorials.add(item.workshop_id)
			sitemapEntries.push({
				url: `${process.env.COURSEBUILDER_URL}${item.workshop_type}s/${item.workshop_slug}`,
				lastModified: new Date(),
				changeFrequency: 'monthly',
				priority: 0.9,
			})
		}
	})

	// Add lesson and exercise entries
	workshopItems.rows.forEach((item: any) => {
		if (item.item_type === 'lesson' || item.item_type === 'exercise') {
			const slug = item.lesson_slug || item.section_or_lesson_slug
			if (slug) {
				sitemapEntries.push({
					url: `${process.env.COURSEBUILDER_URL}${item.workshop_type}s/${item.workshop_slug}/${slug}`,
					lastModified: new Date(),
					changeFrequency: 'monthly',
					priority: 0.7,
				})
			}
		}
	})

	// Add other content types (posts)
	const otherContentItems = await db.execute(sql`
    SELECT
      cr.id,
      cr.type,
      cr.fields->>'$.slug' AS slug,
      cr.updatedAt
    FROM
      ContentResource cr
    WHERE
      cr.type IN ('post')
      AND cr.deletedAt IS NULL
    ORDER BY
      cr.type, cr.updatedAt DESC
  `)

	otherContentItems.rows.forEach((item: any) => {
		let url: string
		let priority: number
		let changeFrequency:
			| 'yearly'
			| 'monthly'
			| 'weekly'
			| 'daily'
			| 'hourly'
			| 'always'
			| 'never'

		switch (item.type) {
			case 'post':
				url = `${process.env.COURSEBUILDER_URL}${item.slug}`
				priority = 0.8
				changeFrequency = 'monthly'
				break
			default:
				return // Skip unknown types
		}

		sitemapEntries.push({
			url,
			lastModified: new Date(item.updatedAt),
			changeFrequency,
			priority,
		})
	})

	// Add the homepage
	sitemapEntries.unshift({
		url: `${process.env.COURSEBUILDER_URL}`,
		lastModified: new Date(),
		changeFrequency: 'daily',
		priority: 1,
	})

	return sitemapEntries
}
