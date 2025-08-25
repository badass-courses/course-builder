'use client'

import { use, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Check, Copy, Search } from 'lucide-react'
import { z } from 'zod'

import { Input } from '@coursebuilder/ui/primitives/input'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@coursebuilder/ui/primitives/pagination'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui/primitives/select'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@coursebuilder/ui/primitives/table'

const PurchaseDataSchema = z.object({
	user_id: z.string(),
	email: z.string(),
	name: z.string().nullish(),
	productId: z.string(),
	product_name: z.string(),
	purchase_date: z.string(),
})
type PurchaseData = z.infer<typeof PurchaseDataSchema>
const PurchaseDataResultSchema = z.object({
	data: z.array(PurchaseDataSchema),
	totalCount: z.number(),
})
type PurchaseDataResult = z.infer<typeof PurchaseDataResultSchema>

const formatDate = (dateString: string) => {
	const date = new Date(dateString)
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date)
}

const memoizedFormatDate = (() => {
	const cache = new Map<string, string>()

	return (dateString: string) => {
		if (cache.has(dateString)) {
			return cache.get(dateString)!
		}

		const formatted = formatDate(dateString)
		cache.set(dateString, formatted)
		return formatted
	}
})()

/**
 * Renders a single purchase item in a card format, suitable for mobile views.
 * @param item - The purchase data object.
 */
function PurchaseCard({ item }: { item: PurchaseData }) {
	return (
		<div className="bg-card text-card-foreground shadow-xs mb-4 rounded-lg border p-4">
			<div className="mb-2 flex flex-col space-y-1">
				<p className="text-sm font-medium leading-none">{item.name || 'N/A'}</p>
				<p className="text-muted-foreground text-xs">{item.email}</p>
			</div>
			<div className="text-sm">
				<p>
					<span className="text-muted-foreground font-medium">Product:</span>{' '}
					{item.product_name}
				</p>
				<p>
					<span className="text-muted-foreground font-medium">Purchased:</span>{' '}
					{memoizedFormatDate(item.purchase_date)}
				</p>
			</div>
		</div>
	)
}

export default function ProductPurchasesTable({
	purchaseDataResultLoader,
	currentPage,
	pageSize,
}: {
	purchaseDataResultLoader: Promise<PurchaseDataResult | null>
	currentPage: number
	pageSize: number
}) {
	const [searchTerm, setSearchTerm] = useState('')
	const [copiedAll, setCopiedAll] = useState(false)
	const purchaseDataResult = use(purchaseDataResultLoader)
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const { data: purchaseData, totalCount } = purchaseDataResult ?? {
		data: [],
		totalCount: 0,
	}
	const totalPages = Math.ceil(totalCount / pageSize)

	const filteredData = useMemo(() => {
		return purchaseData.filter(
			(item) =>
				(item?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				item?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item?.product_name.toLowerCase().includes(searchTerm.toLowerCase()),
		)
	}, [purchaseData, searchTerm])

	if (!purchaseDataResult || purchaseData.length === 0) {
		return (
			<div className="m-4 space-y-4 sm:my-12">
				<div className="bg-card text-card-foreground shadow-xs rounded-lg border p-8 text-center">
					<h2 className="mb-2 text-xl font-medium">
						No purchase data available
					</h2>
				</div>
			</div>
		)
	}

	const handleCopyAllEmails = () => {
		const emails = filteredData.map((item) => item.email).join('\n')
		navigator.clipboard
			.writeText(emails)
			.then(() => {
				setCopiedAll(true)
				setTimeout(() => setCopiedAll(false), 1500)
			})
			.catch((err) => {
				console.error('Failed to copy emails: ', err)
			})
	}

	const createPageURL = (pageNumber: number | string, limit?: number) => {
		const params = new URLSearchParams(searchParams)
		params.set('page', pageNumber.toString())
		params.set('limit', (limit || pageSize).toString())
		return `${pathname}?${params.toString()}`
	}

	const handlePageSizeChange = (value: string) => {
		const newPageSize = parseInt(value, 10)
		router.push(createPageURL(1, newPageSize))
	}

	const startItem = (currentPage - 1) * pageSize + 1
	const endItem = Math.min(currentPage * pageSize, totalCount)
	const caption = `Showing ${
		filteredData.length > 0
			? `${startItem}-${Math.min(startItem + filteredData.length - 1, endItem)}`
			: '0'
	} of ${totalCount} total purchases.${searchTerm ? ` (${filteredData.length} matches current search)` : ''}`

	return (
		<div className="m-4 space-y-4 sm:my-12">
			<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
				<h2 className="text-2xl font-semibold">Product Purchases</h2>
				<div className="flex-1" />
				<div className="relative w-full max-w-sm">
					<Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
					<Input
						type="search"
						placeholder="Search this page..."
						className="pl-8"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			{/* Mobile Copy Button */}
			<div className="mt-4 md:hidden">
				<button
					onClick={handleCopyAllEmails}
					className="hover:bg-primary/90 bg-primary text-primary-foreground flex w-full items-center justify-center gap-1 rounded p-2 text-sm font-medium"
					title="Copy all visible emails"
				>
					{copiedAll ? (
						<>
							<Check className="h-4 w-4" /> Copied!
						</>
					) : (
						<>
							<Copy className="h-4 w-4" /> Copy Emails to Clipboard
						</>
					)}
				</button>
			</div>

			{/* Desktop Table View */}
			<div className="hidden rounded-md border pb-4 md:block">
				<Table>
					<TableCaption>{caption}</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[180px]">User</TableHead>
							<TableHead>
								<div className="flex items-center gap-1">
									Email
									<button
										onClick={handleCopyAllEmails}
										className="hover:bg-muted rounded p-0.5"
										title="Copy all visible emails"
									>
										{copiedAll ? (
											<Check className="h-3 w-3 text-green-500" />
										) : (
											<Copy className="h-3 w-3" />
										)}
									</button>
								</div>
							</TableHead>
							<TableHead>Product ID</TableHead>
							<TableHead>Product Name</TableHead>
							<TableHead className="text-right">Purchase Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredData.length > 0 ? (
							filteredData.map((item, index) => (
								<TableRow
									key={`${item.user_id}-${item.productId}-${item.purchase_date}`}
								>
									<TableCell className="font-medium">
										{item.name || 'N/A'}
									</TableCell>
									<TableCell>{item.email}</TableCell>
									<TableCell>{item.productId}</TableCell>
									<TableCell>{item.product_name}</TableCell>
									<TableCell className="text-right">
										{memoizedFormatDate(item.purchase_date)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
									{searchTerm
										? 'No results match your search on this page.'
										: 'No purchases found for this page.'}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Mobile Card View */}
			<div className="md:hidden">
				{filteredData.length > 0 ? (
					filteredData.map((item, index) => (
						<PurchaseCard
							key={`${item.user_id}-${item.productId}-${item.purchase_date}`}
							item={item}
						/>
					))
				) : (
					<div className="bg-card text-card-foreground shadow-xs rounded-lg border p-4 text-center">
						{searchTerm
							? 'No results match your search on this page.'
							: 'No purchases found for this page.'}
					</div>
				)}
				<p className="text-muted-foreground pt-2 text-center text-sm">
					{caption}
				</p>
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between pt-4">
					<div className="flex items-center space-x-2">
						<span className="text-sm text-gray-700 dark:text-gray-400">
							Rows per page:
						</span>
						<Select
							value={pageSize.toString()}
							onValueChange={handlePageSizeChange}
						>
							<SelectTrigger className="h-8 w-[70px]">
								<SelectValue placeholder={pageSize} />
							</SelectTrigger>
							<SelectContent side="top">
								{[50, 100, 200].map((size) => (
									<SelectItem key={size} value={`${size}`}>
										{size}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href={createPageURL(currentPage - 1)}
									aria-disabled={currentPage <= 1}
									tabIndex={currentPage <= 1 ? -1 : undefined}
									className={
										currentPage <= 1
											? 'pointer-events-none opacity-50'
											: undefined
									}
								/>
							</PaginationItem>
							{Array.from({ length: totalPages }, (_, i) => i + 1).map(
								(page) => (
									<PaginationItem key={page}>
										<PaginationLink
											href={createPageURL(page)}
											isActive={currentPage === page}
										>
											{page}
										</PaginationLink>
									</PaginationItem>
								),
							)}
							<PaginationItem>
								<PaginationNext
									href={createPageURL(currentPage + 1)}
									aria-disabled={currentPage >= totalPages}
									tabIndex={currentPage >= totalPages ? -1 : undefined}
									className={
										currentPage >= totalPages
											? 'pointer-events-none opacity-50'
											: undefined
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	)
}
