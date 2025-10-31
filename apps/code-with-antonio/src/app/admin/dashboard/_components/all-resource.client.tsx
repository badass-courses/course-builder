'use client'

import { use } from 'react'
import Link from 'next/link'
import { useConfirm } from '@/hooks/use-confirm'
import { PencilIcon, TrashIcon } from 'lucide-react'

import {
	Badge,
	Pagination,
	PaginationContent,
	PaginationItem,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@coursebuilder/ui'
import { Button, buttonVariants } from '@coursebuilder/ui/primitives/button'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { deleteResource } from './all-resources.server'

type ResourceData = Awaited<
	ReturnType<
		(
			currentPage: number,
			limit: number,
		) => Promise<{
			resources: any[]
			currentPage: number
			totalPages: number
		}>
	>
>

/**
 * Client component that uses React.use() to stream data
 * @param dataPromise - Promise containing paginated resources data
 */
export function AllResourcesClient({
	dataPromise,
}: {
	dataPromise: Promise<ResourceData>
}) {
	const { resources, currentPage, totalPages } = use(dataPromise)
	const [ConfirmDialog, confirm] = useConfirm()

	const handleDelete = async (resourceId: string, resourceTitle: string) => {
		const confirmed = await confirm({
			title: 'Delete Resource',
			description: `Are you sure you want to delete "${resourceTitle}"? This action cannot be undone.`,
			confirmText: 'Delete',
			cancelText: 'Cancel',
			variant: 'destructive',
		})

		if (confirmed) {
			await deleteResource(resourceId)
		}
	}

	return (
		<div className="space-y-4">
			<ConfirmDialog />
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>State</TableHead>
						<TableHead>Product</TableHead>
						<TableHead>Parent</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{resources.map((resource) => {
						// Build parent hierarchy
						const parents = []
						const immediateParent = resource.resourceOf?.[0]?.resourceOf
						const grandParent = immediateParent?.resourceOf?.[0]?.resourceOf
						const greatGrandParent = grandParent?.resourceOf?.[0]?.resourceOf

						// Add great-grandparent if exists
						if (greatGrandParent?.fields?.title) {
							parents.push(greatGrandParent.fields.title)
						}

						// Add grandparent (workshop/list) if exists
						if (grandParent?.fields?.title) {
							parents.push(grandParent.fields.title)
						}

						// Add immediate parent (section/lesson) if exists
						if (immediateParent?.fields?.title) {
							parents.push(immediateParent.fields.title)
						}

						// Get products from current resource
						const resourceProducts = resource.resourceProducts
							?.map((rp: any) => rp.product?.name)
							.filter(Boolean)

						// Get products from immediate parent resource
						const parentProducts = immediateParent?.resourceProducts
							?.map((rp: any) => rp.product?.name)
							.filter(Boolean)

						// Get products from grandparent resource
						const grandParentProducts = grandParent?.resourceProducts
							?.map((rp: any) => rp.product?.name)
							.filter(Boolean)

						// Get products from great-grandparent resource
						const greatGrandParentProducts = greatGrandParent?.resourceProducts
							?.map((rp: any) => rp.product?.name)
							.filter(Boolean)

						// Combine all products (removing duplicates)
						const allProducts = Array.from(
							new Set([
								...(resourceProducts || []),
								...(parentProducts || []),
								...(grandParentProducts || []),
								...(greatGrandParentProducts || []),
							]),
						)

						// Determine effective parent based on resource type and hierarchy
						let effectiveParent = immediateParent
						let resourceSlugForPath = resource.fields?.slug

						// For solutions, we need the workshop/list parent and lesson slug
						if (resource.type === 'solution') {
							// Navigate up to find the parent lesson and workshop
							if (
								immediateParent?.type === 'lesson' ||
								immediateParent?.type === 'exercise'
							) {
								// Solutions use their parent lesson's slug in the URL
								resourceSlugForPath = immediateParent.fields?.slug

								// Lesson/exercise parent - check if its parent is section or workshop
								if (grandParent?.type === 'section') {
									// Section -> need to go up one more to workshop
									effectiveParent = greatGrandParent
								} else if (
									grandParent?.type === 'workshop' ||
									grandParent?.type === 'list' ||
									grandParent?.type === 'tutorial'
								) {
									// Direct workshop/list parent
									effectiveParent = grandParent
								}
							}
						} else if (immediateParent?.type === 'section') {
							// For other resources, if immediate parent is section, use grandparent
							effectiveParent = grandParent
						}

						return (
							<TableRow key={resource.id}>
								<TableCell>
									<Link
										className="hover:underline"
										href={getResourcePath(
											resource.type,
											resourceSlugForPath,
											'view',
											{
												parentSlug: effectiveParent?.fields?.slug,
												parentType: effectiveParent?.type ?? '',
											},
										)}
									>
										{resource.fields?.title || 'Untitled'}
									</Link>
								</TableCell>
								<TableCell>
									<Badge variant="outline">{resource.type}</Badge>
								</TableCell>
								<TableCell>
									<Badge
										variant={
											resource.fields?.state === 'published'
												? 'default'
												: 'outline'
										}
									>
										{resource.fields?.state || 'draft'}
									</Badge>
								</TableCell>
								<TableCell>
									{allProducts.length > 0 ? (
										<div className="flex flex-col gap-1">
											{allProducts.map((productName, idx) => (
												<Badge key={idx} variant="secondary">
													{productName}
												</Badge>
											))}
										</div>
									) : (
										<span className="text-muted-foreground text-sm">—</span>
									)}
								</TableCell>
								<TableCell>
									{parents.length > 0 ? (
										<span className="text-muted-foreground text-sm">
											{parents.join(' / ')}
										</span>
									) : (
										<span className="text-muted-foreground text-sm">—</span>
									)}
								</TableCell>
								<TableCell className="flex items-center gap-1">
									<Button variant="outline" size="icon" asChild>
										<Link
											href={getResourcePath(
												resource.type,
												resourceSlugForPath,
												'edit',
												{
													parentSlug: effectiveParent?.fields?.slug,
													parentType: effectiveParent?.type ?? '',
												},
											)}
										>
											<PencilIcon className="size-4" />
										</Link>
									</Button>
									<Button
										variant="outline"
										size="icon"
										onClick={() =>
											handleDelete(
												resource.id,
												resource.fields?.title || 'Untitled',
											)
										}
									>
										<TrashIcon className="size-4" />
									</Button>
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>

			{totalPages > 1 && (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							{currentPage > 1 ? (
								<Button asChild variant="ghost">
									<Link scroll={false} href={`?page=${currentPage - 1}`}>
										Previous
									</Link>
								</Button>
							) : (
								<span className="text-muted-foreground flex items-center gap-1 pl-2.5 text-sm opacity-0">
									Previous
								</span>
							)}
						</PaginationItem>

						{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
							// Show first page, last page, current page, and pages around current
							const showPage =
								page === 1 ||
								page === totalPages ||
								(page >= currentPage - 1 && page <= currentPage + 1)

							if (!showPage) {
								// Show ellipsis if there's a gap
								if (page === currentPage - 2 || page === currentPage + 2) {
									return (
										<PaginationItem key={page}>
											<span className="text-muted-foreground">...</span>
										</PaginationItem>
									)
								}
								return null
							}

							return (
								<PaginationItem key={page}>
									<Link
										scroll={false}
										aria-current={page === currentPage ? 'page' : undefined}
										className={cn(
											buttonVariants({
												variant: page === currentPage ? 'outline' : 'ghost',
												size: 'icon',
											}),
										)}
										href={`?page=${page}`}
									>
										{page}
									</Link>
								</PaginationItem>
							)
						})}

						<PaginationItem>
							{currentPage < totalPages ? (
								<Button asChild variant="ghost">
									<Link scroll={false} href={`?page=${currentPage + 1}`}>
										Next
									</Link>
								</Button>
							) : (
								<span className="text-muted-foreground flex items-center gap-1 pr-2.5 text-sm opacity-0">
									Next
								</span>
							)}
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	)
}
