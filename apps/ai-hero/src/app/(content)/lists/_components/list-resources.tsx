'use client'

import Link from 'next/link'
import type { List } from '@/lib/lists'
import { Check } from 'lucide-react'

import { useProgress } from '../../[post]/_components/progress-provider'

export default function ListResources({ list }: { list: List }) {
	const { progress } = useProgress()

	return (
		<aside className="col-span-2">
			{list.resources.length > 0 && (
				<>
					<h3 className="fluid-lg mb-3 font-sans font-semibold tracking-tight">
						Content
					</h3>
					<ol className="divide-border flex flex-col divide-y rounded border">
						{list.resources.map(({ resource }, i) => {
							const isComplete = progress?.completedLessons.find(
								({ resourceId }) => resourceId === resource.id,
							)
							return (
								<li key={resource.id}>
									<Link
										className="hover:bg-muted flex items-center gap-3 px-2 py-2 font-medium transition sm:py-3"
										href={`/${resource.fields.slug}?list=${list.fields.slug}`}
									>
										<small className="min-w-[2ch] text-right font-mono text-xs font-normal opacity-60">
											{i + 1}
										</small>
										{isComplete && <Check className="w-4" />}
										{resource.fields.title}
									</Link>
								</li>
							)
						})}
					</ol>
				</>
			)}
		</aside>
	)
}
