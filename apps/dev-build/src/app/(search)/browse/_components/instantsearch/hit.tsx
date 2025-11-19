'use client'

import Link from 'next/link'
import ResourceTeaser from '@/components/content/resource-teaser'
import { Contributor } from '@/components/contributor'
import type { TypesenseResource } from '@/lib/typesense'
import { formatInTimeZone } from 'date-fns-tz'
import { Highlight } from 'react-instantsearch'

import { Badge } from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export default function Hit({ hit }: { hit: TypesenseResource }) {
	const getMetadataForType = (type: string) => {
		switch (type) {
			case 'tutorial':
				return 'tutorial'

			case 'article':
				return 'article'

			case 'nextUp':
				return 'nextUp'
			case 'post':
				return 'post'
			case 'workshop':
				return 'workshop'
			case 'cohort':
				return 'cohort'
			default:
				return ''
		}
	}

	// For solutions, construct URL using parent resources (solutions use parent lesson's slug)
	const getResourceHref = () => {
		if (hit.type === 'solution') {
			const parentLesson = hit.parentResources?.find(
				(p) => p.type === 'lesson' || p.type === 'exercise',
			)
			const parentWorkshop = hit.parentResources?.find(
				(p) =>
					p.type === 'workshop' || p.type === 'list' || p.type === 'tutorial',
			)

			if (parentLesson && parentWorkshop) {
				return getResourcePath(hit.type, parentLesson.slug, 'view', {
					parentSlug: parentWorkshop.slug,
					parentType: parentWorkshop.type,
				})
			}
		}

		return getResourcePath(hit.type, hit.slug, 'view')
	}

	return (
		<li className="">
			<ResourceTeaser
				variant="card"
				title={hit.title}
				href={getResourceHref()}
				description={hit.summary}
				metadata={
					hit.type === 'cohort' && hit.startsAt && hit.endsAt
						? `${formatInTimeZone(new Date(hit.startsAt), 'America/Los_Angeles', 'MMM d, yyyy')} — ${formatInTimeZone(new Date(hit.endsAt), 'America/Los_Angeles', 'MMM d, yyyy')}`
						: getMetadataForType(hit.type)
				}
				// thumbnailUrl={
				// 	hit.image ||
				// 	'https://res.cloudinary.com/dezn0ffbx/image/upload/v1760615686/thumbnail-article_2x_sl3c0e.jpg'
				// }
				tags={hit.tags?.map((tag) => tag.fields?.label || tag.fields?.name)}
				titleSlot={
					<Highlight
						attribute="title"
						hit={hit as any}
						classNames={{
							highlighted: 'bg-primary text-primary-foreground',
						}}
					/>
				}
			/>
			{/* <Link
				prefetch
				className="to-secondary hover:bg-linear-to-l group flex flex-col items-baseline justify-between gap-2 from-transparent px-5 py-5 transition ease-in-out sm:py-5 md:flex-row lg:px-6"
				href={getResourceHref()}
			>
				<div className="flex flex-col gap-2 md:w-4/6">
					<span className="pr-5 text-lg font-semibold sm:truncate lg:text-xl">
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
				<div className="mt-3 flex shrink-0 flex-wrap items-center gap-3 sm:pl-0 md:mt-0 md:gap-10 md:pl-7">
					<Contributor className="flex text-sm md:hidden [&_img]:w-7" />
					{hit?.tags && hit.tags.length > 0 && (
						<div className="flex flex-wrap items-center gap-1">
							{hit.tags.map((tag) => {
								return (
									<Badge
										key={tag.id}
										variant="outline"
										className="text-muted-foreground flex shrink-0 items-center gap-3 rounded-full text-left text-sm opacity-75"
									>
										<span># {tag.fields?.label || tag.fields?.name}</span>
									</Badge>
								)
							})}
						</div>
					)}
					<div className="text-muted-foreground flex min-w-[130px] shrink-0 flex-row gap-3 text-sm capitalize opacity-75 md:flex-col md:gap-0">
						<span className="font-semibold">{hit.type}</span>
						{hit.created_at_timestamp && (
							<span>
								{format(new Date(hit.created_at_timestamp), 'MMM d, y')}
							</span>
						)}
					</div>
				</div>
			</Link> */}
		</li>
	)
}
