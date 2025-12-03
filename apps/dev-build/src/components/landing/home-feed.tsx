'use client'

import { use } from 'react'
import type { FeedItem } from '@/lib/feed-query'
import { motion } from 'framer-motion'

import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import ResourceTeaser from '../content/resource-teaser'
import SplitText from '../split-text'

export default function HomeFeed({
	feedLoader,
}: {
	feedLoader: Promise<FeedItem[]>
}) {
	const feed = use(feedLoader)

	return (
		<section className="container pb-16">
			<SplitText
				as="h2"
				className="mb-4 text-center text-2xl font-bold sm:text-left sm:text-3xl"
			>
				The Feed
			</SplitText>
			<ul className="flex flex-col gap-10">
				{feed.map((resource) => {
					const videoResource = resource.resources?.find(
						(r) => r.resource.type === 'videoResource',
					)
					const tags = resource?.tags?.map((tag: any) => tag.tag.fields?.label)

					return (
						<motion.li
							whileInView={{ opacity: 1, y: 0 }}
							initial={{ opacity: 0, y: 10 }}
							exit={{ opacity: 0, y: 10 }}
							transition={{ duration: 0.5 }}
							key={resource.id}
						>
							<ResourceTeaser
								variant="list"
								body={resource.fields?.body}
								title={resource.fields?.title}
								href={getResourcePath(
									resource.type,
									resource.fields?.slug,
									'view',
								)}
								description={resource.fields?.description}
								thumbnailUrl={
									videoResource
										? `https://image.mux.com/${videoResource?.resource.fields?.muxPlaybackId}/thumbnail.png?time=${videoResource?.resource.fields?.thumbnailTime || 0}&width=880`
										: resource.fields?.coverImage?.url || null
								}
								tags={tags}
								ctaText="Read more"
							/>
						</motion.li>
					)
				})}
			</ul>
		</section>
	)
}
