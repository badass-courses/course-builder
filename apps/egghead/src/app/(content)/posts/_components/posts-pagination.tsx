'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { logger } from '@/lib/utils/logger'

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui'

interface PostsPaginationProps {
	currentPage: number
	pageSize: number
	totalCount: number
}

/**
 * Pagination component for posts list
 * Handles page navigation while preserving search and filter parameters
 */
export function PostsPagination({
	currentPage,
	pageSize,
	totalCount,
}: PostsPaginationProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	// Calculate total pages
	const totalPages = Math.ceil(totalCount / pageSize)

	// Don't show pagination if only one page
	if (totalPages <= 1) return null

	/**
	 * Updates URL with new page/pageSize while preserving other params
	 */
	const updateUrl = (newPage: number, newPageSize?: number) => {
		const params = new URLSearchParams(searchParams)

		// Update page
		if (newPage === 1) {
			params.delete('page')
		} else {
			params.set('page', newPage.toString())
		}

		// Update pageSize if provided
		if (newPageSize !== undefined) {
			if (newPageSize === 50) {
				params.delete('pageSize')
			} else {
				params.set('pageSize', newPageSize.toString())
			}
		}

		const queryString = params.toString()
		const url = queryString ? `${pathname}?${queryString}` : pathname

		logger.info('Pagination navigation', {
			fromPage: currentPage,
			toPage: newPage,
			pageSize: newPageSize ?? pageSize,
		})

		router.push(url)
	}

	/**
	 * Handles page size change - resets to page 1
	 */
	const handlePageSizeChange = (newPageSize: string) => {
		updateUrl(1, Number(newPageSize))
	}

	/**
	 * Generate page numbers to display with ellipsis
	 */
	const getPageNumbers = () => {
		const delta = 2 // Number of pages to show on each side of current page
		const range: (number | string)[] = []
		const rangeWithDots: (number | string)[] = []
		let l: number | undefined

		// Always show first page
		range.push(1)

		// Calculate range around current page
		for (let i = currentPage - delta; i <= currentPage + delta; i++) {
			if (i > 1 && i < totalPages) {
				range.push(i)
			}
		}

		// Always show last page
		if (totalPages > 1) {
			range.push(totalPages)
		}

		// Add dots where there are gaps
		range.forEach((i) => {
			if (l !== undefined && typeof i === 'number') {
				if (i - l === 2) {
					rangeWithDots.push(l + 1)
				} else if (i - l !== 1) {
					rangeWithDots.push('...')
				}
			}
			rangeWithDots.push(i)
			l = typeof i === 'number' ? i : undefined
		})

		return rangeWithDots
	}

	return (
		<div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
			{/* Results info and page size selector */}
			<div className="flex items-center gap-4">
				<p className="text-muted-foreground text-sm">
					Showing {(currentPage - 1) * pageSize + 1}-
					{Math.min(currentPage * pageSize, totalCount)} of {totalCount} posts
				</p>
				<Select
					value={pageSize.toString()}
					onValueChange={handlePageSizeChange}
				>
					<SelectTrigger className="w-[100px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="50">50</SelectItem>
						<SelectItem value="100">100</SelectItem>
						<SelectItem value="250">250</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Pagination controls */}
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href="#"
							onClick={(e) => {
								e.preventDefault()
								if (currentPage > 1) updateUrl(currentPage - 1)
							}}
							className={
								currentPage === 1 ? 'pointer-events-none opacity-50' : ''
							}
						/>
					</PaginationItem>

					{getPageNumbers().map((pageNum, idx) => (
						<PaginationItem key={idx}>
							{pageNum === '...' ? (
								<PaginationEllipsis />
							) : (
								<PaginationLink
									href="#"
									onClick={(e) => {
										e.preventDefault()
										updateUrl(pageNum as number)
									}}
									isActive={pageNum === currentPage}
								>
									{pageNum}
								</PaginationLink>
							)}
						</PaginationItem>
					))}

					<PaginationItem>
						<PaginationNext
							href="#"
							onClick={(e) => {
								e.preventDefault()
								if (currentPage < totalPages) updateUrl(currentPage + 1)
							}}
							className={
								currentPage === totalPages
									? 'pointer-events-none opacity-50'
									: ''
							}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	)
}
