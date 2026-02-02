import { NextRequest, NextResponse } from 'next/server'
import { serializeToMarkdown } from '@/lib/markdown-serializer'
import { getWorkshop } from '@/lib/workshops-query'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ module: string; lesson: string }> },
) {
	const { module, lesson } = await params
	const workshop = await getWorkshop(module)

	if (!workshop) {
		return new NextResponse('Not Found', { status: 404 })
	}

	// Find the lesson in workshop resources (may be nested in sections)
	const lessonResource = findLessonInWorkshop(workshop, lesson)

	if (!lessonResource) {
		return new NextResponse('Not Found', { status: 404 })
	}

	// Only serve free-tier lessons
	if (lessonResource.metadata?.tier !== 'free') {
		return new NextResponse('Premium content', { status: 403 })
	}

	const markdown = serializeToMarkdown(lessonResource.resource)

	return new NextResponse(markdown, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
		},
	})
}

function findLessonInWorkshop(
	workshop: NonNullable<Awaited<ReturnType<typeof getWorkshop>>>,
	lessonSlug: string,
): any {
	// Check direct resources
	for (const res of workshop.resources || []) {
		if (res.resource?.fields?.slug === lessonSlug) return res
		// Check section resources
		for (const nested of res.resource?.resources || []) {
			if (nested.resource?.fields?.slug === lessonSlug) return nested
		}
	}
	return null
}
