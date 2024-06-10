import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { and, eq, or, sql } from 'drizzle-orm'

export const runtime = 'edge'

export const revalidate = 60
export const contentType = 'image/png'

export default async function Image({
	params,
}: {
	params: { article: string }
}) {
	const article = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					params.article,
				),
				eq(contentResource.id, params.article),
			),
			eq(contentResource.type, 'article'),
		),
	})

	const dmSans = fetch(
		new URL('../../../../public/fonts/DMSans-Medium.ttf', import.meta.url),
	).then((res) => res.arrayBuffer())

	return new ImageResponse(
		(
			<div
				tw="flex h-full w-full bg-gray-50 flex-col"
				style={{
					...font('dmsans'),
					// backgroundImage: `url("${process.env.NEXT_PUBLIC_URL}/assets/og-bg@2x.jpg")`,
					// backgroundSize: '1200px 630px',
					width: 1200,
					height: 630,
				}}
			>
				<main tw="flex p-24 flex-colw-full gap-5 h-full flex-grow items-center text-center justify-center">
					<div tw="text-[90px] text-gray-900 leading-tight">
						{article?.fields?.title}
					</div>
				</main>
			</div>
		),
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: 'dmsans',
					data: await dmSans,
				},
			],
		},
	)
}

// lil helper for more succinct styles
function font(fontFamily: string) {
	return { fontFamily }
}
