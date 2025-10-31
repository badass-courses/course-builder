'use server'

import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { deletePostInTypeSense } from '@/lib/typesense-query'
import { count, desc, eq, inArray } from 'drizzle-orm'

import { AllResourcesClient } from './all-resource.client'

const RESOURCE_TYPES = [
	'event',
	'lesson',
	'article',
	'tutorial',
	'workshop',
	'post',
	'list',
	'solution',
]

export async function deleteResource(resourceId: string) {
	await db
		.delete(contentResource)
		.where(eq(contentResource.id, resourceId))
		.then(() => {
			deletePostInTypeSense(resourceId).then(() => {
				revalidatePath('/admin/dashboard')
			})
		})
		.catch((error) => {
			console.error('Error deleting resource:', error)
		})
}

/**
 * Loads paginated content resources with their relationships
 */
async function loadResourcesData(currentPage: number, limit: number) {
	const offset = (currentPage - 1) * limit

	const [allContentResources, totalCountResult] = await Promise.all([
		db.query.contentResource.findMany({
			where: inArray(contentResource.type, RESOURCE_TYPES),
			orderBy: desc(contentResource.createdAt),
			with: {
				resourceProducts: {
					with: {
						product: true,
					},
				},
				resources: {
					with: {
						resource: true,
					},
				},
				resourceOf: {
					with: {
						resourceOf: {
							with: {
								resourceProducts: {
									with: {
										product: true,
									},
								},
								resourceOf: {
									with: {
										resourceOf: {
											with: {
												resourceProducts: {
													with: {
														product: true,
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			limit,
			offset,
		}),
		db
			.select({ count: count() })
			.from(contentResource)
			.where(inArray(contentResource.type, RESOURCE_TYPES)),
	])

	const totalCount = totalCountResult[0]?.count || 0
	const totalPages = Math.ceil(totalCount / limit)

	return {
		resources: allContentResources,
		currentPage,
		totalPages,
	}
}

/**
 * AllResourcesList - displays paginated list of all content resources
 * @param searchParams - URL search parameters containing page number
 */
export default async function AllResourcesList({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>
}) {
	const params = await searchParams
	const currentPage = Number(params.page) || 1
	const limit = 10

	const dataPromise = loadResourcesData(currentPage, limit)

	return (
		<section>
			<h2 className="mb-5 text-lg font-semibold leading-none tracking-tight">
				All your resources
			</h2>
			<Suspense fallback={<ResourcesLoadingFallback />}>
				<AllResourcesClient dataPromise={dataPromise} />
			</Suspense>
		</section>
	)
}

function ResourcesLoadingFallback() {
	return (
		<div className="flex items-center justify-center py-12">
			<div className="text-muted-foreground">Loading resources...</div>
		</div>
	)
}
