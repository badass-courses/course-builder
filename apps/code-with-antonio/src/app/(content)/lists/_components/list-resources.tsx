'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { List } from '@/lib/lists'
import { Check } from 'lucide-react'

import { useProgress } from '../../[post]/_components/progress-provider'

export default function ListResources({ list }: { list: List }) {
	const { progress } = useProgress()
	const firstResource = list.resources?.[0]?.resource
	const firstResourceHref = `/${firstResource?.fields?.slug}`
	const router = useRouter()

	React.useEffect(() => {
		router.prefetch(firstResourceHref)
	}, [])

	return (
		<aside className="md:bg-muted col-span-2 border-l dark:md:bg-transparent">
			{list.resources.length > 0 && (
				<>
					<div className="block border-y px-5 py-4 text-lg font-semibold sm:hidden">
						Content
					</div>
					<ol className="dark:divide-border flex flex-col divide-y divide-gray-200 sm:border-b">
						{list.resources.map(({ resource }, i) => {
							const isComplete = progress?.completedLessons.find(
								({ resourceId }) => resourceId === resource.id,
							)
							return (
								<li key={resource.id}>
									<Link
										prefetch
										className="dark:hover:bg-muted hover:text-primary text-foreground/90 hover:bg-background flex min-h-14 items-center gap-3 px-2 py-2 pr-3 font-medium transition sm:py-2 sm:pr-4"
										href={`/${resource.fields.slug}`}
									>
										{isComplete ? (
											<Check className="text-muted-foreground w-4 shrink-0" />
										) : (
											<small className="min-w-[2ch] text-right font-mono text-[9px] font-normal opacity-60">
												{i + 1}
											</small>
										)}
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
