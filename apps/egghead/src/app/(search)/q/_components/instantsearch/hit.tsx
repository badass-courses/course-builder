'use client'

import Link from 'next/link'
import type { TypesenseResource } from '@/lib/typesense'

export default function Hit({ hit }: { hit: TypesenseResource }) {
	return (
		<li>
			<Link
				className="group flex items-center justify-between py-1.5"
				href={`/${hit.slug}`}
			>
				<div className="flex items-center gap-2">
					{hit.image && <img src={hit.image} alt={hit.title} className="w-5" />}
					<span className="truncate pr-5 group-hover:underline">
						{hit.title}
					</span>
				</div>
				<div className="flex flex-shrink-0 items-center gap-3 text-sm opacity-60">
					<span>{hit.instructor_name}</span>
					<span>{hit.type}</span>
				</div>
			</Link>
		</li>
	)
}
