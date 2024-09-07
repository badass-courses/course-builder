import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { writeContributionTypes } from '@/scripts/controbution-types'
import { sanityQuery } from '@/scripts/utils/sanity-client'
import { guid } from '@/utils/guid'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

await writeContributionTypes()

const sanityPageSchema = z.object({
	_type: z.string(),
	description: z.string(),
	body: z.string(),
	_createdAt: z.string(),
	_updatedAt: z.string(),
	slug: z.object({
		current: z.string(),
	}),
	title: z.string(),
	_id: z.string(),
})

type SanityPage = z.infer<typeof sanityPageSchema>

export async function migratePages(WRITE_TO_DB: boolean = true) {
	const pages = await sanityQuery<SanityPage[]>(`*[_type == "page"]`)

	for (const page of pages) {
		const resource = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, page._id),
		})

		if (resource) {
			console.log('page found', page._id)
		} else {
			const newResourceId = page._id || guid()

			console.info('created page', newResourceId)
			WRITE_TO_DB &&
				(await db.insert(contentResource).values({
					id: newResourceId,
					type: page._type,
					createdById: '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
					createdAt: new Date(page._createdAt),
					updatedAt: new Date(page._updatedAt),
					deletedAt: null,
					fields: {
						title: page.title,
						body: page.body,
						description: page.description,
						visibility: 'public',
						slug: page.slug.current,
					},
				}))
		}
	}
}
