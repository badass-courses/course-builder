'use client'

import Link from 'next/link'
import { Contributor } from '@/components/contributor'
import type { TypesenseResource } from '@/lib/typesense'
import { api } from '@/trpc/react'
import { formatInTimeZone } from 'date-fns-tz'
import { ChevronRight } from 'lucide-react'
import { Highlight } from 'react-instantsearch'

import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

/**
 * Component that fetches and displays the author for a search hit.
 * Fetches author data from the database via tRPC.
 */
function HitAuthor({ resourceId }: { resourceId: string }) {
	const { data: author, isLoading } = api.authors.getResourceAuthor.useQuery(
		{ resourceId },
		{
			staleTime: 1000 * 60 * 5, // Cache for 5 minutes
			refetchOnWindowFocus: false,
		},
	)

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-sm font-normal">
				<div className="bg-muted ring-gray-800/7.5 h-7 w-7 animate-pulse rounded-full ring-1" />
				<div className="bg-muted h-4 w-20 animate-pulse rounded" />
			</div>
		)
	}

	if (author) {
		const authorName = author.name || author.email || 'Author'
		const authorInitial = authorName[0]?.toUpperCase() || 'A'

		return (
			<div className="flex items-center gap-2 text-sm font-normal">
				{author.image ? (
					<img
						src={author.image}
						alt={authorName}
						className="bg-muted ring-gray-800/7.5 w-7 shrink-0 rounded-full ring-1"
					/>
				) : (
					<div className="bg-muted ring-gray-800/7.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1">
						<span className="text-foreground/60 text-xs font-medium">
							{authorInitial}
						</span>
					</div>
				)}
				<span className="text-foreground/90 font-heading font-medium">
					{authorName}
				</span>
			</div>
		)
	}

	// Fallback to default contributor (Kent C. Dodds)
	return <Contributor className="flex text-sm [&_img]:w-7" />
}

export default function Hit({ hit }: { hit: TypesenseResource }) {
	return (
		<li className="bg-card rounded-lg border px-6 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
			<Link
				prefetch
				className="group flex h-full flex-col py-5 transition ease-out sm:py-5"
				href={getResourcePath(hit.type, hit.slug, 'view')}
			>
				<div className="flex h-full grow flex-col gap-4">
					<div className="flex flex-col gap-2">
						<span className="sm:fluid-xl fluid-lg font-heading group-hover:text-primary pr-5 font-bold tracking-tight transition ease-out sm:tracking-tight">
							<Highlight
								attribute="title"
								hit={hit as any}
								classNames={{
									highlighted: 'bg-primary text-primary-foreground',
								}}
							/>
						</span>
						<span className="text-muted-foreground -mt-1 text-sm font-medium">
							{hit.type === 'event' && hit?.startsAt && (
								<>
									<span>
										{formatInTimeZone(
											hit.startsAt,
											'America/Los_Angeles',
											'MMM d, y - h:mmaaa',
										)}{' '}
										PT
									</span>
								</>
							)}
						</span>
						{hit.summary && (
							<Highlight
								attribute="summary"
								hit={hit as any}
								classNames={{
									highlighted: 'bg-primary text-primary-foreground',
									nonHighlighted: 'text-muted-foreground',
								}}
							/>
						)}
					</div>
					<div className="mt-auto flex w-full flex-wrap items-center justify-between gap-4">
						{/* Author display - fetched from database */}
						<HitAuthor resourceId={hit.id} />
						{/* <div className="text-muted-foreground flex flex-row flex-wrap gap-3 text-sm capitalize">
							{hit.type && (
								<>
									<span className="font-normal">{hit.type}</span>
								</>
							)}
						</div> */}
						<div className="text-primary inline-flex items-center gap-1">
							Read more <ChevronRight className="w-3" />
						</div>
					</div>
				</div>
				{/* <div className="mt-3 flex flex-shrink-0 flex-wrap items-center gap-3 sm:pl-0 md:mt-0 md:gap-10 md:pl-7">
					<Contributor className="flex text-sm md:hidden [&_img]:size-8" />
					{hit?.tags && hit.tags.length > 0 && (
						<div className="flex flex-wrap items-center gap-1">
							{hit.tags.map((tag) => {
								return (
									<Badge
										key={tag.id}
										variant="outline"
										className="text-muted-foreground flex flex-shrink-0 items-center gap-3 rounded-full text-left text-sm opacity-75"
									>
										<span># {tag.fields?.label || tag.fields?.name}</span>
									</Badge>
								)
							})}
						</div>
					)}
				</div> */}
			</Link>
		</li>
	)
}
