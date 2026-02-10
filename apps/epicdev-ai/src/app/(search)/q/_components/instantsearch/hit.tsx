'use client'

import Link from 'next/link'
import { Contributor, type AuthorInfo } from '@/components/contributor'
import type { TypesenseResource } from '@/lib/typesense'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { ChevronRight } from 'lucide-react'
import { Highlight } from 'react-instantsearch'

import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export default function Hit({ hit }: { hit: TypesenseResource }) {
	// Create author object if author data exists in hit
	const author: AuthorInfo | undefined = hit.authorName
		? { name: hit.authorName, image: hit.authorImage }
		: undefined

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
						<Contributor className="flex text-sm [&_img]:w-7" author={author} />
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
