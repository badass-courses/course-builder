import { ImageResponse } from 'next/og'
import { getPrompt } from '@/lib/prompts-query'

export const revalidate = 60

export default async function PromptOG({
	params,
}: {
	params: { slug: string }
}) {
	//   const authorPhoto = fetch(
	//     new URL(`../../public/images/author.jpg`, import.meta.url)
	//   ).then(res => res.arrayBuffer());

	// fonts

	const resource = await getPrompt(params.slug)

	return new ImageResponse(
		(
			<div
				tw="flex p-10 h-full w-full bg-white flex-col"
				style={{
					...font('sans'),
				}}
			>
				<main tw="flex flex-col gap-5 h-full grow items-start pb-24 justify-center px-16">
					<div tw="text-[60px] text-white">{resource?.fields?.title}</div>
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
