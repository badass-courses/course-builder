'use client'

import Link from 'next/link'
import { Contributor } from '@/app/_components/contributor'
import type { TypesenseResource } from '@/lib/typesense'
import { format } from 'date-fns'
import { Highlight } from 'react-instantsearch'

import { Badge } from '@coursebuilder/ui'

export default function Hit({ hit }: { hit: TypesenseResource }) {
	return (
		<li className="">
			<Link
				className="to-secondary group flex flex-col items-baseline justify-between gap-2 from-transparent px-5 py-5 transition ease-in-out hover:bg-gradient-to-l sm:py-5 md:flex-row lg:px-6"
				href={`/${hit.slug}`}
			>
				<div className="flex flex-col gap-2 md:w-4/6">
					<span className="fluid-lg pr-5 font-semibold sm:truncate">
						{/* {hit.title} */}
						<Highlight
							attribute="title"
							hit={hit as any}
							classNames={{
								highlighted: 'bg-primary text-primary-foreground',
							}}
						/>
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
					<Contributor className="mt-3 hidden text-sm md:flex [&_img]:w-7" />
				</div>
				<div className="mt-3 flex flex-shrink-0 flex-wrap items-center gap-3 sm:pl-0 md:mt-0 md:gap-10 md:pl-7">
					<Contributor className="flex text-sm md:hidden [&_img]:w-7" />
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
					<div className="text-muted-foreground leading-1 flex min-w-[130px] flex-shrink-0 flex-row gap-3 text-sm capitalize opacity-75 md:flex-col md:gap-0">
						<span className="font-semibold">{hit.type}</span>
						{hit.created_at_timestamp && (
							<span>
								{format(new Date(hit.created_at_timestamp), 'MMM d, y')}
							</span>
						)}
					</div>
				</div>
			</Link>
		</li>
	)
}
