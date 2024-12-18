'use client'

import Link from 'next/link'
import type { TypesenseResource } from '@/lib/typesense'

export default function Hit({ hit }: { hit: TypesenseResource }) {
	return (
		<li className="">
			<Link
				className="group flex flex-row items-baseline justify-between gap-2 py-3 sm:py-3"
				href={`/${hit.slug}`}
			>
				<div className="flex items-center gap-2">
					<span className="pr-5 font-medium group-hover:underline sm:truncate">
						{hit.title}
					</span>
				</div>
				<div className="text-muted-foreground flex flex-shrink-0 items-center gap-3 pl-7 text-sm opacity-75 sm:pl-0">
					<span>{hit.type}</span>
				</div>
			</Link>
		</li>
	)
}
