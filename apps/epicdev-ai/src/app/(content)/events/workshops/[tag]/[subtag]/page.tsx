import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLiveWorkshopsPerTag } from '@/lib/live-workshops-query'
import { getCachedPage } from '@/lib/pages-query'
import { getCachedTag, getCachedTags } from '@/lib/tags-query'

import WorkshopPage from '../../_components/workshop-page'

export async function generateStaticParams() {
	const tags = await getCachedTags()

	return tags.map((tag) => ({
		tag: tag.fields.slug,
		subtag: tag.fields.slug,
	}))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ tag: string; subtag: string }>
}): Promise<Metadata> {
	const { tag: tagParam, subtag: subtagParam } = await params
	const tag = await getCachedTag(tagParam)
	const subtag = await getCachedTag(subtagParam)

	const page = await getCachedPage(
		`/events/workshops/${tagParam}/${subtagParam}`,
	)
	if (!tag || !subtag) {
		return {}
	}
	const { upcomingEvents, soldOutOrPastIds } = await getLiveWorkshopsPerTag([
		tag,
		subtag,
	])

	const pageTitle = page?.fields?.title || tag.fields.label
	const pageDescription =
		page?.fields?.description ||
		'Learn the fundamentals of MCP and how to use it to build your own AI-powered applications.'
	// Prepare events data for OG image
	const eventsForOG = upcomingEvents.slice(0, 4).map((event) => ({
		id: event.id,
		date: event.fields?.startsAt || '',
		timezone: event.fields?.timezone ?? 'America/Los_Angeles',
		isSoldOut: soldOutOrPastIds.includes(event.id),
	}))

	const ogImageUrl = new URL('/api/og/events', process.env.NEXT_PUBLIC_URL)
	ogImageUrl.searchParams.set('title', pageTitle)
	if (eventsForOG.length > 0) {
		ogImageUrl.searchParams.set(
			'events',
			encodeURIComponent(JSON.stringify(eventsForOG)),
		)
	}

	return {
		title: pageTitle,
		description:
			'Learn the fundamentals of MCP and how to use it to build your own AI-powered applications.',
		openGraph: {
			title: pageTitle,
			description: pageDescription,
			images: [
				{
					url: ogImageUrl.toString(),
					width: 1200,
					height: 630,
					alt: pageTitle,
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			title: pageTitle,
			description: pageDescription,
			images: [ogImageUrl.toString()],
		},
	}
}

export default async function WorkshopSubtagPage({
	params,
}: {
	params: Promise<{ tag: string; subtag: string }>
}) {
	const { tag: tagParam, subtag: subtagParam } = await params
	const tag = await getCachedTag(tagParam)
	const subtag = await getCachedTag(subtagParam)
	if (!tag || !subtag) {
		notFound()
	}
	const page = await getCachedPage(
		`/events/workshops/${tagParam}/${subtagParam}`,
	)
	const { pastEvents, upcomingEvents, soldOutOrPastIds } =
		await getLiveWorkshopsPerTag([tag, subtag])

	const pageTitle = page?.fields?.title || tag.fields.label

	return (
		<WorkshopPage
			page={page}
			pageTitle={pageTitle}
			pastEvents={pastEvents}
			upcomingEvents={upcomingEvents}
			soldOutOrPastIds={soldOutOrPastIds}
		/>
	)
}
