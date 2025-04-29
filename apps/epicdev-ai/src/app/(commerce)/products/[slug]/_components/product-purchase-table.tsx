'use client'

import { use, useState } from 'react'
import { Check, Copy, Search } from 'lucide-react'
import { z } from 'zod'

import { Input } from '@coursebuilder/ui/primitives/input'
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

/**
 * Renders a single purchase item in a card format, suitable for mobile views.
 * @param item - The purchase data object.
 */
function PurchaseCard({ item }: { item: PurchaseData }) {
	return (
		<div className="bg-card text-card-foreground mb-4 rounded-lg border p-4 shadow-sm">
			<div className="mb-2 flex flex-col space-y-1">
				<p className="text-sm font-medium leading-none">{item.name || 'N/A'}</p>
				<p className="text-muted-foreground text-xs">{item.email}</p>
			</div>
			<div className="text-sm">
				<p>
					<span className="text-muted-foreground font-medium">Product:</span>{' '}
					{item.product_name} ({item.productId})
				</p>
				<p>
					<span className="text-muted-foreground font-medium">Purchased:</span>{' '}
					{formatDate(item.purchase_date)}
				</p>
			</div>
		</div>
	)
}

export default function ProductPurchasesTable({
	purchaseDataLoader,
}: {
	purchaseDataLoader: Promise<PurchaseData[] | null>
}) {
	const [searchTerm, setSearchTerm] = useState('')
	const [copiedAll, setCopiedAll] = useState(false)
	const purchaseData = use(purchaseDataLoader)

	if (!purchaseData) return null
	const filteredData = purchaseData.filter(
		(item) =>
			item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item?.product_name.toLowerCase().includes(searchTerm.toLowerCase()),
	)

	const handleCopyAllEmails = () => {
		const emails = filteredData.map((item) => item.email).join('\n')
		navigator.clipboard
			.writeText(emails)
			.then(() => {
				setCopiedAll(true)
				setTimeout(() => setCopiedAll(false), 1500) // Reset icon after 1.5 seconds
			})
			.catch((err) => {
				console.error('Failed to copy emails: ', err)
			})
	}

	const caption = `Showing ${filteredData.length} of ${purchaseData.length} valid purchases for selected products`

	return (
		<div className="m-4 space-y-4">
			<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
				<h2 className="text-2xl font-bold">Product Purchases</h2>
				<div className="flex-1" />
				<div className="relative w-full max-w-sm">
					<Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
					<Input
						type="search"
						placeholder="Search by name, email or product..."
						className="pl-8"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

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
								<TableRow key={index}>
									<TableCell className="font-medium">
										{item.name || 'N/A'}
									</TableCell>
									<TableCell>{item.email}</TableCell>
									<TableCell>{item.productId}</TableCell>
									<TableCell>{item.product_name}</TableCell>
									<TableCell className="text-right">
										{formatDate(item.purchase_date)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
									No results found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="md:hidden">
				{filteredData.length > 0 ? (
					filteredData.map((item, index) => (
						<PurchaseCard key={index} item={item} />
					))
				) : (
					<div className="bg-card text-card-foreground rounded-lg border p-4 text-center shadow-sm">
						No results found.
					</div>
				)}
				<p className="text-muted-foreground pt-2 text-center text-sm">
					{caption}
				</p>
			</div>
		</div>
	)
}
