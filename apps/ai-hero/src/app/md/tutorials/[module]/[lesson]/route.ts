import { NextRequest, NextResponse } from 'next/server'
import { serializeToMarkdown } from '@/lib/markdown-serializer'
import { getTutorial } from '@/lib/tutorials-query'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ module: string; lesson: string }> },
) {
	const { module, lesson } = await params
	const tutorial = await getTutorial(module)

	if (!tutorial) {
		return new NextResponse('Not Found', { status: 404 })
	}

	// Find the lesson in tutorial resources (may be nested in sections)
	const lessonResource = findLessonInTutorial(tutorial, lesson)

	if (!lessonResource) {
		return new NextResponse('Not Found', { status: 404 })
	}

	const markdown = serializeToMarkdown(lessonResource.resource)

	return new NextResponse(markdown, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
		},
	})
}

function findLessonInTutorial(
	tutorial: NonNullable<Awaited<ReturnType<typeof getTutorial>>>,
	lessonSlug: string,
): any {
	// Check direct resources
	for (const res of tutorial.resources || []) {
		if (res.resource?.fields?.slug === lessonSlug) return res
		// Check section resources
		for (const nested of res.resource?.resources || []) {
			if (nested.resource?.fields?.slug === lessonSlug) return nested
		}
	}
	return null
}
