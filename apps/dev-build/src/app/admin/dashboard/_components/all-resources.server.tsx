'use server'

import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { deletePostInTypeSense } from '@/lib/typesense-query'
import { log } from '@/server/logger'
import { count, desc, eq, inArray } from 'drizzle-orm'
import { FileText } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@coursebuilder/ui'

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

/**
 * Deletes a resource from the database and Typesense
 * @param resourceId - The ID of the resource to delete
 */
export async function deleteResource(resourceId: string) {
	try {
		await log.info('resource.delete.started', { resourceId })

		await db.delete(contentResource).where(eq(contentResource.id, resourceId))

		await log.info('resource.delete.database.success', { resourceId })

		try {
			await deletePostInTypeSense(resourceId)
			await log.info('resource.delete.typesense.success', { resourceId })
		} catch (error) {
			await log.error('resource.delete.typesense.failed', {
				resourceId,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			})
			// Continue even if Typesense deletion fails
		}

		revalidatePath('/admin/dashboard')
		await log.info('resource.delete.completed', { resourceId })
	} catch (error) {
		await log.error('resource.delete.failed', {
			resourceId,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})
		throw error
	}
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
		<Card>
			<CardHeader>
				<div className="flex items-center gap-5">
					<FileText className="text-muted-foreground h-4 w-4" />
					<div className="space-y-1">
						<CardTitle className="text-lg font-bold">
							All your resources
						</CardTitle>
					</div>
				</div>
			</CardHeader>
			<CardContent className="border-t px-0">
				<Suspense fallback={<ResourcesLoadingFallback />}>
					<AllResourcesClient dataPromise={dataPromise} />
				</Suspense>
			</CardContent>
		</Card>
	)
}

function ResourcesLoadingFallback() {
	return (
		<div className="flex items-center justify-center py-12">
			<div className="text-muted-foreground">Loading resources...</div>
		</div>
	)
}
