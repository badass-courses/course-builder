import { NextRequest, NextResponse } from 'next/server'
import { serializeToMarkdown } from '@/lib/markdown-serializer'
import { getCachedPostOrList } from '@/lib/posts-query'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params
	const content = await getCachedPostOrList(slug)

	if (!content) {
		return new NextResponse('Not Found', { status: 404 })
	}

	// Only serve free content (published + public)
	if (
		content.fields.state !== 'published' ||
		content.fields.visibility !== 'public'
	) {
		return new NextResponse('Not Found', { status: 404 })
	}

	const markdown = serializeToMarkdown(content)

	return new NextResponse(markdown, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
		},
	})
}
