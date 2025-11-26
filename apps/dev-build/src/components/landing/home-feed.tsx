import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { CldImage } from '../cld-image'
import ResourceTeaser from '../content/resource-teaser'

export default function HomeFeed({
	feedLoader,
}: {
	feedLoader: Promise<ContentResource[]>
}) {
	const feed = use(feedLoader)

	return (
		<section className="container pb-16">
			<h2 className="mb-4 text-center text-2xl font-bold sm:text-left sm:text-3xl">
				The Feed
			</h2>
			<ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
				{feed.map((resource) => {
					const videoResource = resource.resources.find(
						(r) => r.resource.type === 'videoResource',
					)
					return (
						<ResourceTeaser
							key={resource.id}
							variant="card"
							title={resource.fields?.title}
							href={getResourcePath(
								resource.type,
								resource.fields.slug,
								'view',
							)}
							description={resource.fields?.description}
							thumbnailUrl={
								videoResource
									? `https://image.mux.com/${videoResource?.resource.fields?.muxPlaybackId}/thumbnail.png?time=${videoResource?.resource.fields?.thumbnailTime || 0}&width=880`
									: resource.fields?.coverImage?.url || null
							}
							tags={resource.fields?.tags?.map(
								(tag) => tag.fields?.label || tag.fields?.name,
							)}
						/>
					)
				})}
			</ul>
		</section>
	)
}
