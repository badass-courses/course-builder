'use client'

import Link from 'next/link'
import type { TypesenseResource } from '@/lib/typesense'

export default function Hit({ hit }: { hit: TypesenseResource }) {
	return (
		<li className="">
			<Link
				className="group flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-1.5"
				target={'_blank'}
				href={`https://egghead.io${hit.path}`}
			>
				<div className="flex items-center gap-2">
					{hit.image && <img src={hit.image} alt={hit.title} className="w-5" />}
					<span className="pr-5 font-medium group-hover:underline sm:truncate">
						{hit.title}
					</span>
				</div>
				<div className="text-muted-foreground flex shrink-0 items-center gap-3 pl-7 text-sm opacity-75 sm:pl-0">
					<span>{hit.instructor_name}</span>
					<span>{hit.type}</span>
				</div>
			</Link>
		</li>
	)
}
