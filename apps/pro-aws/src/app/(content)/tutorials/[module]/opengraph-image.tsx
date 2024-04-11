import { ImageResponse } from 'next/og'
import { getTutorial } from '@/lib/tutorials-query'

export const revalidate = 60

export default async function TutorialOG({
	params,
}: {
	params: { module: string }
}) {
	const resource = await getTutorial(params.module)

	return new ImageResponse(
		(
			<div
				tw="flex p-10 h-full w-full bg-black flex-col"
				style={{
					...font('sans'),
				}}
			>
				<main tw="flex bg-background flex-col gap-5 h-full flex-grow items-start pb-5 justify-center px-16">
					<div tw="text-[60px] text-white">{resource?.fields?.title}</div>
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
