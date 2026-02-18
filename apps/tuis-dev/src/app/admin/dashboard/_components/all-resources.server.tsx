'use server'

import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { deletePostInTypeSense } from '@/lib/typesense-query'
import { count, desc, eq, inArray } from 'drizzle-orm'
import { LayoutListIcon } from 'lucide-react'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

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
	await db.delete(contentResource).where(eq(contentResource.id, resourceId))
	await deletePostInTypeSense(resourceId).catch((error) => {
		console.error('Error deleting from TypeSense:', error)
	})
	revalidatePath('/admin/dashboard', 'page')
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
					<LayoutListIcon className="text-muted-foreground h-4 w-4" />
					<div className="space-y-1">
						<CardTitle className="text-lg font-bold">All Resources</CardTitle>
						<CardDescription>Browse and manage all content</CardDescription>
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
