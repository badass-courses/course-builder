'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
	createShortlink,
	deleteShortlink,
	updateShortlink,
} from '@/lib/shortlinks-query'
import {
	RecentClickStats,
	ShortlinkWithAttributions,
} from '@/lib/shortlinks-types'
import {
	BarChart3,
	Check,
	Clock,
	Copy,
	ExternalLink,
	Pencil,
	Plus,
	Search,
	Trash2,
} from 'lucide-react'

import {
	Button,
	Card,
	CardContent,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	useToast,
} from '@coursebuilder/ui'

import ShortlinkCrudDialog from './shortlink-crud-dialog'

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}

function CopyButton({ text, label }: { text: string; label?: string }) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={handleCopy}
					>
						{copied ? (
							<Check className="h-4 w-4 text-green-500" />
						) : (
							<Copy className="h-4 w-4" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{copied ? 'Copied!' : label || 'Copy'}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

function formatDate(date: Date | string): string {
	const d = new Date(date)
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

/**
 * Format destination URL for display
 * If it starts with aihero.dev or ai-hero.dev, show only the path
 */
function formatDestination(url: string): string {
	try {
		const parsed = new URL(url)
		const host = parsed.hostname.toLowerCase()
		if (
			host === 'aihero.dev' ||
			host === 'ai-hero.dev' ||
			host === 'www.aihero.dev'
		) {
			return parsed.pathname + parsed.search + parsed.hash || '/'
		}
		// For other URLs, show truncated version
		const display = url.replace(/^https?:\/\//, '')
		if (display.length > 40) {
			return display.substring(0, 40) + '...'
		}
		return display
	} catch {
		return url.length > 40 ? url.substring(0, 40) + '...' : url
	}
}

export default function ShortlinksManagement({
	initialShortlinks,
	recentStats,
}: {
	initialShortlinks: ShortlinkWithAttributions[]
	recentStats: RecentClickStats
}) {
	const { toast } = useToast()
	const [shortlinks, setShortlinks] =
		useState<ShortlinkWithAttributions[]>(initialShortlinks)
	const [searchTerm, setSearchTerm] = useState('')
	const debouncedSearchTerm = useDebounce(searchTerm, 250)
	const [deleteConfirmation, setDeleteConfirmation] = useState<{
		isOpen: boolean
		shortlinkId: string | null
	}>({ isOpen: false, shortlinkId: null })
	const [isDeleting, setIsDeleting] = useState(false)

	const baseUrl =
		typeof window !== 'undefined'
			? window.location.origin
			: 'https://ai-hero.dev'

	const filteredShortlinks = useCallback(() => {
		return shortlinks.filter(
			(link) =>
				link.slug.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
				link.url.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
				link.description
					?.toLowerCase()
					.includes(debouncedSearchTerm.toLowerCase()),
		)
	}, [shortlinks, debouncedSearchTerm])

	const handleCreate = async (data: {
		id?: string
		slug?: string
		url?: string
		description?: string
	}) => {
		if (!data.url) {
			throw new Error('URL is required')
		}
		const newLink = await createShortlink({ ...data, url: data.url })
		// Add default attribution counts for new links
		const newLinkWithAttributions: ShortlinkWithAttributions = {
			...newLink,
			signups: 0,
			purchases: 0,
		}
		setShortlinks([newLinkWithAttributions, ...shortlinks])
	}

	const handleEdit = async (data: {
		id?: string
		slug?: string
		url?: string
		description?: string
	}) => {
		if (!data.id) {
			throw new Error('ID is required')
		}
		const updatedLink = await updateShortlink({ ...data, id: data.id })
		setShortlinks(
			shortlinks.map((link) => {
				if (link.id === updatedLink.id) {
					// Preserve attribution counts from existing link
					return {
						...updatedLink,
						signups: link.signups,
						purchases: link.purchases,
					}
				}
				return link
			}),
		)
	}

	const handleDeleteConfirmation = (id: string) => {
		setDeleteConfirmation({ isOpen: true, shortlinkId: id })
	}

	const handleDelete = async () => {
		if (deleteConfirmation.shortlinkId) {
			setIsDeleting(true)
			try {
				await deleteShortlink(deleteConfirmation.shortlinkId)
				setShortlinks(
					shortlinks.filter(
						(link) => link.id !== deleteConfirmation.shortlinkId,
					),
				)
			} catch (error) {
				toast({
					title: 'Error deleting shortlink',
					description:
						error instanceof Error ? error.message : 'An error occurred',
					variant: 'destructive',
				})
			} finally {
				setIsDeleting(false)
				setDeleteConfirmation({ isOpen: false, shortlinkId: null })
			}
		}
	}

	return (
		<main className="flex w-full flex-col p-10">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
				<h1 className="font-heading text-xl font-bold sm:text-3xl">
					Shortlinks
				</h1>

				{/* Recent stats cards */}
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:w-fit">
					<Card className="border-muted">
						<CardContent className="flex items-center gap-3 p-4">
							<Clock className="text-muted-foreground h-5 w-5" />
							<div>
								<p className="text-2xl font-bold">
									{recentStats.last60Minutes}
								</p>
								<p className="text-muted-foreground text-xs">Last 60 min</p>
							</div>
						</CardContent>
					</Card>
					<Card className="border-muted">
						<CardContent className="flex items-center gap-3 p-4">
							<BarChart3 className="text-muted-foreground h-5 w-5" />
							<div>
								<p className="text-2xl font-bold">{recentStats.last24Hours}</p>
								<p className="text-muted-foreground text-xs">Last 24 hours</p>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search shortlinks..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-8"
						/>
					</div>
					<ShortlinkCrudDialog onSubmit={handleCreate}>
						<Button className="w-full sm:w-auto">
							<Plus className="mr-2 h-4 w-4" /> Create Shortlink
						</Button>
					</ShortlinkCrudDialog>
				</div>

				{shortlinks.length === 0 ? (
					<div className="text-muted-foreground py-12 text-center">
						<p>No shortlinks yet. Create your first one!</p>
					</div>
				) : (
					<>
						<div className="hidden overflow-hidden rounded-lg shadow-sm sm:block">
							<table className="divide-border min-w-full divide-y">
								<thead>
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
											Short URL
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
											Destination
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
											Clicks
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
											Signups
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
											Purchases
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
											Created
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-border divide-y">
									{filteredShortlinks().map((link) => (
										<tr
											key={link.id}
											className="hover:bg-gray-50 dark:hover:bg-gray-900"
										>
											<td className="whitespace-nowrap px-6 py-4">
												<div className="flex items-center gap-2">
													<code className="bg-muted rounded px-2 py-1 text-sm">
														/s/{link.slug}
													</code>
													<CopyButton
														text={`${baseUrl}/s/${link.slug}`}
														label="Copy short URL"
													/>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="font-mono text-sm">
																	{formatDestination(link.url)}
																</span>
															</TooltipTrigger>
															<TooltipContent className="max-w-md">
																<p className="break-all">{link.url}</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
													<CopyButton
														text={link.url}
														label="Copy destination"
													/>
													<a
														href={link.url}
														target="_blank"
														rel="noopener noreferrer"
														className="text-muted-foreground hover:text-foreground"
													>
														<ExternalLink className="h-4 w-4" />
													</a>
												</div>
												{link.description && (
													<p className="text-muted-foreground mt-1 text-xs">
														{link.description}
													</p>
												)}
											</td>
											<td className="whitespace-nowrap px-6 py-4">
												<span className="font-mono text-sm">
													{link.clicks.toLocaleString()}
												</span>
											</td>
											<td className="whitespace-nowrap px-6 py-4">
												<span className="font-mono text-sm">
													{link.signups.toLocaleString()}
												</span>
											</td>
											<td className="whitespace-nowrap px-6 py-4">
												<span className="font-mono text-sm">
													{link.purchases.toLocaleString()}
												</span>
											</td>
											<td className="whitespace-nowrap px-6 py-4 text-sm">
												{formatDate(link.createdAt)}
											</td>
											<td className="whitespace-nowrap px-6 py-4">
												<div className="flex space-x-2">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<Link
																	href={`/admin/shortlinks/${link.id}/analytics`}
																>
																	<Button variant="outline" size="icon">
																		<BarChart3 className="h-4 w-4" />
																	</Button>
																</Link>
															</TooltipTrigger>
															<TooltipContent>
																<p>View analytics</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
													<ShortlinkCrudDialog
														shortlink={link}
														onSubmit={handleEdit}
													>
														<Button variant="outline" size="icon">
															<Pencil className="h-4 w-4" />
														</Button>
													</ShortlinkCrudDialog>
													<Button
														variant="destructive"
														size="icon"
														onClick={() => handleDeleteConfirmation(link.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="space-y-4 sm:hidden">
							{filteredShortlinks().map((link) => (
								<div
									key={link.id}
									className="overflow-hidden rounded-lg border shadow-sm"
								>
									<div className="border-b px-4 py-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<code className="bg-muted rounded px-2 py-1 text-sm">
													/s/{link.slug}
												</code>
												<CopyButton
													text={`${baseUrl}/s/${link.slug}`}
													label="Copy short URL"
												/>
											</div>
											<div className="text-muted-foreground flex gap-3 text-sm">
												<span>{link.clicks.toLocaleString()} clicks</span>
												<span>{link.signups.toLocaleString()} signups</span>
												<span>{link.purchases.toLocaleString()} purchases</span>
											</div>
										</div>
									</div>
									<div className="px-4 py-4">
										<div className="mb-4">
											<p className="text-muted-foreground mb-1 text-xs font-medium">
												Destination
											</p>
											<div className="flex items-center gap-2">
												<span className="font-mono text-sm">
													{formatDestination(link.url)}
												</span>
												<CopyButton text={link.url} label="Copy destination" />
												<a
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-muted-foreground hover:text-foreground"
												>
													<ExternalLink className="h-3 w-3" />
												</a>
											</div>
										</div>
										{link.description && (
											<p className="text-muted-foreground mb-4 text-sm">
												{link.description}
											</p>
										)}
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground text-xs">
												Created {formatDate(link.createdAt)}
											</span>
											<div className="flex space-x-2">
												<Link href={`/admin/shortlinks/${link.id}/analytics`}>
													<Button variant="outline" size="icon">
														<BarChart3 className="h-4 w-4" />
													</Button>
												</Link>
												<ShortlinkCrudDialog
													shortlink={link}
													onSubmit={handleEdit}
												>
													<Button variant="outline" size="icon">
														<Pencil className="h-4 w-4" />
													</Button>
												</ShortlinkCrudDialog>
												<Button
													variant="destructive"
													size="icon"
													onClick={() => handleDeleteConfirmation(link.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>

			<Dialog
				open={deleteConfirmation.isOpen}
				onOpenChange={(isOpen) =>
					setDeleteConfirmation({ ...deleteConfirmation, isOpen })
				}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Shortlink</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this shortlink? This will also
							delete all associated analytics data. This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() =>
								setDeleteConfirmation({ isOpen: false, shortlinkId: null })
							}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	)
}
