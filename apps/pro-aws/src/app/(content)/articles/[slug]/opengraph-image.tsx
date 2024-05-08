import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { and, eq, or, sql } from 'drizzle-orm'

export const runtime = 'edge'

export const revalidate = 60
export const contentType = 'image/png'

export default async function ArticleOG({
	params,
}: {
	params: { slug: string }
}) {
	//   const authorPhoto = fetch(
	//     new URL(`../../public/images/author.jpg`, import.meta.url)
	//   ).then(res => res.arrayBuffer());

	// fonts

	const resource = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					params.slug,
				),
				eq(contentResource.id, params.slug),
			),
			eq(contentResource.type, 'article'),
		),
	})

	return new ImageResponse(
		(
			<div
				tw="flex p-10 h-full w-full bg-white flex-col"
				style={{
					...font('sans'),
				}}
			>
				<main tw="flex flex-col gap-5 h-full flex-grow items-start pb-24 justify-center px-16">
					<div tw="text-[60px] text-white">{resource?.fields?.title}</div>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					{/* <img
                tw="rounded-full h-74"
                alt={author.name}
                @ts-ignore
                src={await authorPhoto}
              /> */}
				</main>
			</div>
		),
		{
			width: 1200,
			height: 630,
		},
	)
}

// lil helper for more succinct styles
function font(fontFamily: string) {
	return { fontFamily }
}
