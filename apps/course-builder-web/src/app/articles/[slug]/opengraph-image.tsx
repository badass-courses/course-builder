import { ImageResponse } from 'next/og'
import { getArticle } from '@/lib/articles-query'

export const revalidate = 60

export default async function ArticleOG({
	params,
}: {
	params: { slug: string }
}) {
	//   const authorPhoto = fetch(
	//     new URL(`../../public/images/author.jpg`, import.meta.url)
	//   ).then(res => res.arrayBuffer());

	// fonts
	const inter600 = fetch(
		new URL(
			`../../../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff`,
			import.meta.url,
		),
	).then((res) => res.arrayBuffer())

	const resource = await getArticle(params.slug)

	return new ImageResponse(
		(
			<div
				tw="flex p-10 h-full w-full bg-white flex-col"
				style={{
					...font('Inter 600'),
					backgroundImage:
						'url(https://res.cloudinary.com/badass-courses/image/upload/v1700690096/course-builder-og-image-template_qfarun.png)',
				}}
			>
				<main tw="flex flex-col gap-5 h-full flex-grow items-start pb-24 justify-center px-16">
					<div tw="text-[60px] text-white">{resource?.title}</div>
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
			fonts: [
				{
					name: 'Inter 600',
					data: await inter600,
				},
			],
		},
	)
}

// lil helper for more succinct styles
function font(fontFamily: string) {
	return { fontFamily }
}
