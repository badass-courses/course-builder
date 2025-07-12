'use client'

import Link from 'next/link'
import { Contributor } from '@/components/contributor'
import type { TypesenseResource } from '@/lib/typesense'
import { getResourcePath } from '@/utils/resource-paths'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Highlight } from 'react-instantsearch'

export default function Hit({ hit }: { hit: TypesenseResource }) {
	return (
		<li className="">
			<Link
				prefetch
				className="group flex flex-col items-baseline justify-between gap-2 py-5 transition ease-in-out sm:py-5 md:flex-row"
				href={getResourcePath(hit.type, hit.slug, 'view')}
			>
				<div className="flex flex-col gap-2">
					<span className="fluid-lg group-hover:text-primary pr-5 font-bold transition sm:truncate">
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
					<div className="mt-3 flex flex-wrap items-center gap-4">
						<Contributor className="flex text-sm [&_img]:w-7" />

						<div className="text-muted-foreground flex flex-row flex-wrap gap-3 text-sm capitalize">
							{hit.type && (
								<>
									<span className="font-normal">{hit.type}</span>
								</>
							)}
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
