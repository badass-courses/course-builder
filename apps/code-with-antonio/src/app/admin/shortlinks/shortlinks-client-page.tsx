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
 * If it starts with codewithantonio.com, show only the path
 */
function formatDestination(url: string): string {
	try {
		const parsed = new URL(url)
		const host = parsed.hostname.toLowerCase()
		if (host === 'codewithantonio.com' || host === 'www.codewithantonio.com') {
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
			: 'https://codewithantonio.com'

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
		<main className="flex w-full flex-col p-6 sm:p-10">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
				<div>
					<h1 className="font-heading mb-1 text-2xl font-bold tracking-tight sm:text-4xl">
						Shortlinks
					</h1>
					<p className="text-muted-foreground text-sm">
						Manage and track your short URLs with analytics
					</p>
				</div>

				{/* Recent stats cards */}
				<div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:w-fit">
					<Card className="border-border/50 from-background to-muted/20 group bg-gradient-to-br shadow-sm transition-all hover:shadow-md">
						<CardContent className="flex items-center gap-4 p-6">
							<div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
								<Clock className="h-5 w-5" />
							</div>
							<div>
								<p className="text-3xl font-bold tracking-tight">
									{recentStats.last60Minutes}
								</p>
								<p className="text-muted-foreground mt-0.5 text-xs font-medium uppercase tracking-wider">
									Last 60 min
								</p>
							</div>
						</CardContent>
					</Card>
					<Card className="border-border/50 from-background to-muted/20 group bg-gradient-to-br shadow-sm transition-all hover:shadow-md">
						<CardContent className="flex items-center gap-4 p-6">
							<div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
								<BarChart3 className="h-5 w-5" />
							</div>
							<div>
								<p className="text-3xl font-bold tracking-tight">
									{recentStats.last24Hours}
								</p>
								<p className="text-muted-foreground mt-0.5 text-xs font-medium uppercase tracking-wider">
									Last 24 hours
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
					<div className="relative w-full sm:w-80">
						<Search className="text-muted-foreground/50 absolute left-3 top-3 h-4 w-4" />
						<Input
							placeholder="Search by slug, URL, or description..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="border-border/50 h-11 pl-10 shadow-sm transition-shadow focus:shadow-md"
						/>
					</div>
					<ShortlinkCrudDialog onSubmit={handleCreate}>
						<Button className="h-11 w-full gap-2 shadow-sm sm:w-auto">
							<Plus className="h-4 w-4" /> Create Shortlink
						</Button>
					</ShortlinkCrudDialog>
				</div>

				{shortlinks.length === 0 ? (
					<Card className="border-border/50 from-background to-muted/10 border-2 border-dashed bg-gradient-to-br">
						<CardContent className="flex flex-col items-center justify-center px-8 py-20 text-center">
							<div className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
								<Plus className="text-primary h-10 w-10" />
							</div>
							<h3 className="mb-2 text-2xl font-bold tracking-tight">
								No shortlinks yet
							</h3>
							<p className="text-muted-foreground mb-8 max-w-md text-sm leading-relaxed">
								Create your first shortlink to start tracking clicks, signups,
								and conversions. Perfect for campaigns, social media, and
								marketing attribution.
							</p>
							<ShortlinkCrudDialog onSubmit={handleCreate}>
								<Button size="lg" className="gap-2 shadow-sm">
									<Plus className="h-5 w-5" />
									Create Your First Shortlink
								</Button>
							</ShortlinkCrudDialog>
						</CardContent>
					</Card>
				) : (
					<>
						<div className="border-border/50 hidden overflow-x-auto rounded-xl border shadow-sm sm:block">
							<table className="divide-border min-w-full divide-y">
								<thead className="bg-muted/30">
									<tr>
										<th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
											Short URL
										</th>
										<th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
											Destination
										</th>
										<th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
											Clicks
										</th>
										<th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
											Signups
										</th>
										<th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
											Purchases
										</th>
										<th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
											Created
										</th>
										<th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-border bg-background divide-y">
									{filteredShortlinks().map((link) => (
										<tr
											key={link.id}
											className="hover:bg-muted/20 group transition-colors"
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
								<Card
									key={link.id}
									className="border-border/50 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
								>
									<div className="bg-muted/20 border-border/50 border-b px-4 py-4">
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
								</Card>
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
