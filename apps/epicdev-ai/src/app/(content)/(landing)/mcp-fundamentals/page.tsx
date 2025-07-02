import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCachedLiveWorkshopsPerTag } from '@/lib/live-workshops-query'
import { getCachedPage } from '@/lib/pages-query'
import { getCachedTag } from '@/lib/tags-query'

import TopicLandingPage from '../_components/topic-landing-page'

const TAGS = ['mcp', 'fundamentals']
const PAGE_ID = 'mcp-fundamentals-hza4r'

export default async function MCPFundamentals() {
	const page = await getCachedPage(PAGE_ID)
	if (!page) {
		return notFound()
	}
	const mcpTag = await getCachedTag(TAGS[0]!)
	const fundamentalsTag = await getCachedTag(TAGS[1]!)

	if (!mcpTag || !fundamentalsTag) {
		return notFound()
	}

	const { upcomingEvents, soldOutOrPastIds, pastEvents } =
		await getCachedLiveWorkshopsPerTag([mcpTag, fundamentalsTag])

	return (
		<TopicLandingPage
			page={page}
			upcomingEvents={upcomingEvents}
			soldOutOrPastIds={soldOutOrPastIds}
			pageTitle={page?.fields?.title || 'MCP Fundamentals'}
			pastEvents={pastEvents}
		/>
	)
}

export async function generateMetadata(): Promise<Metadata> {
	const tag = await getCachedTag(TAGS[0]!)
	const subtag = await getCachedTag(TAGS[1]!)

	const page = await getCachedPage(PAGE_ID)

	if (!tag || !subtag) {
		return {}
	}
	const { upcomingEvents, soldOutOrPastIds } =
		await getCachedLiveWorkshopsPerTag([tag, subtag])

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
