import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const revalidate = 60
export const contentType = 'image/png'

export default async function Image() {
	const maison = fetch(
		new URL(
			'../../public/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.ttf',
			import.meta.url,
		),
	).then((res) => res.arrayBuffer())

	return new ImageResponse(
		(
			<div
				tw="flex h-full w-full bg-white flex-col"
				style={{
					...font('maison'),
					background: 'linear-gradient(105deg, #FFF 0.91%, #F7F7F9 100%)',
					width: 1200,
					height: 630,
				}}
			>
				<div tw="flex items-center gap-2 justify-center absolute left-26 top-26">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width={30 * 2.6}
						height={26 * 2.6}
						fill="none"
						viewBox="0 0 30 26"
					>
						<path
							fill={'#000'}
							d="m.56 15.002 5.012 8.696A4.205 4.205 0 0 0 9.206 25.8h4.388L2.754 6.99.56 10.8a4.222 4.222 0 0 0 0 4.203Zm28.88-4.203-5.012-8.697A4.206 4.206 0 0 0 20.794 0h-4.388l10.84 18.809L29.44 15a4.221 4.221 0 0 0 0-4.202Zm-2.762 8.984a3.835 3.835 0 0 1-1.817.454 3.877 3.877 0 0 1-3.346-1.936l-9.506-16.49A3.578 3.578 0 0 0 8.877 0a3.579 3.579 0 0 0-3.132 1.812L3.322 6.017a3.837 3.837 0 0 1 1.817-.454c1.375 0 2.657.742 3.346 1.936l9.506 16.49a3.579 3.579 0 0 0 3.132 1.811 3.578 3.578 0 0 0 3.132-1.812l2.423-4.205Z"
						/>
					</svg>
				</div>
				<main tw="flex p-26 pb-32 flex-colw-full gap-5 h-full flex-grow items-end justify-start">
					<div tw="text-[50px] text-[#262C30] leading-tight">
						The No-BS Solution for Enterprise-Ready Next.js Applications
					</div>
				</main>
			</div>
		),
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: 'maison',
					data: await maison,
				},
			],
		},
	)
}

// lil helper for more succinct styles
function font(fontFamily: string) {
	return { fontFamily }
}
