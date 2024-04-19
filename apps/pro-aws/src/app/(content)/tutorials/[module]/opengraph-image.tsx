import { ImageResponse } from 'next/og'
import { getTutorial } from '@/lib/tutorials-query'

export const revalidate = 60

export default async function TutorialOG({
	params,
}: {
	params: { module: string }
}) {
	const resource = await getTutorial(params.module)
	const rift = fetch(
		new URL(`../../../../../public/fonts/rift.woff`, import.meta.url),
	).then((res) => res.arrayBuffer())

	return new ImageResponse(
		(
			<div
				tw="flex h-full w-full bg-black flex-col"
				style={{
					...font('rift'),
					backgroundImage: `url("${process.env.NEXT_PUBLIC_URL}/assets/og-bg@2x.jpg")`,
					backgroundSize: '1200px 630px',
					width: 1200,
					height: 630,
				}}
			>
				<main tw="flex p-10 bg-background flex-col	w-full gap-5 h-full flex-grow items-center text-center justify-center">
					<div tw="text-[90px] text-white">{resource?.fields?.title}</div>
				</main>
			</div>
		),
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: 'rift',
					data: await rift,
				},
			],
		},
	)
}

// lil helper for more succinct styles
function font(fontFamily: string) {
	return { fontFamily }
}
