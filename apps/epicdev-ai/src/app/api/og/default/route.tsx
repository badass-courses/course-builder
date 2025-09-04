import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { coupon } from '@/db/schema'
import { and, eq, gte, isNull, or } from 'drizzle-orm'

export const runtime = 'edge'
export const revalidate = 60

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const hasTitle = searchParams.has('title')
		const title = hasTitle
			? searchParams.get('title')
			: 'Build Real-World AI-Connected Apps with the Model Context Protocol'

		// Get the font for text rendering
		const BOLD_fontData = await fetch(
			new URL(
				'../../../../../public/fonts/VastagoGrotesk-Bold.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		const LIGHT_fontData = await fetch(
			new URL(
				'../../../../../public/fonts/VastagoGrotesk-Regular.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		// Check for global coupon/default coupon by querying db directly
		let discountPercentage = null

		try {
			// Pick the highest-discount *active* default coupon
			const now = new Date()
			const globalCoupon = await db.query.coupon.findFirst({
				where: and(
					eq(coupon.default, true), // flagged as default
					eq(coupon.status, 1), // status “active” (matches adapter logic)
					or(gte(coupon.expires, now)), // not expired
				),
				orderBy: (coupon, { desc }) => [desc(coupon.percentageDiscount)],
			})

			if (globalCoupon?.percentageDiscount) {
				discountPercentage = Math.floor(
					Number(globalCoupon.percentageDiscount) * 100,
				)
			}
		} catch (error) {
			// Fallback - if coupon query fails, continue without discount
			console.error('Failed to fetch coupon:', error)
		}

		// Use a background image
		const backgroundImageUrl =
			'https://res.cloudinary.com/epic-web/image/upload/v1755775295/card-bg_2x.jpg'

		return new ImageResponse(
			(
				<div
					tw="flex bg-white flex-col "
					style={{
						fontFamily: 'HeadingFont',
						background: '#574FEE',
						width: 1200,
						height: 630,
						backgroundImage: `url(${backgroundImageUrl})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
					}}
				>
					{/* Dark overlay for text readability */}

					{/* Logo */}
					{/* <div tw="flex items-center justify-center absolute left-26 top-26 z-10">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={211 * 1.1}
							height={58 * 1.1}
							fill="none"
							viewBox="0 0 211 58"
						>
							<g clip-path="url(#a)">
								<path
									fill="#fff"
									fill-rule="evenodd"
									d="m58.966-.978.228-.206-3.849-3.464-23.86 21.477V-.414h-5.178V16.27L3.068-4.648-.769-1.195l-.001-.001-3.465 3.849 20.919 23.239H.024v5.178h17.219L-4.235 54.93l3.465 3.849L26.223 28.79-.666-1.08l29.873 26.89L56.899.881l-25.122 27.91L58.77 58.778l3.465-3.85L40.758 31.07h17.218v-5.178h-16.66l20.919-23.24-3.269-3.63Zm.228 60.16L29.207 32.19-.781 59.183l3.85 3.464L26.306 41.73V58h5.178V41.17l23.86 21.477 3.85-3.464Z"
									clip-rule="evenodd"
								/>
							</g>
							<path
								fill="#fff"
								d="m95.071 41-1.506-4.397H82.898L81.392 41h-5.985l10.097-28.499h5.455L101.097 41h-6.026ZM84.69 31.23h7.085l-3.502-10.342h-.081L84.689 31.23Zm39.629-13.192h-6.554v17.425h6.554V41h-19.175v-5.537h6.595V18.038h-6.595v-5.537h19.175v5.537Z"
							/>
							<path
								fill="#CACACA"
								d="M130.197 41V11.28h4.885v10.056h.082c1.262-1.588 3.42-2.524 5.74-2.524 4.845 0 8.061 3.297 8.061 8.06V41h-4.885V27.931c0-2.89-1.629-4.56-4.438-4.56-2.809 0-4.56 1.792-4.56 4.56V41h-4.885Zm22.245-10.789c0-6.717 4.194-11.4 10.056-11.4 5.985 0 9.975 4.56 9.975 11.156v1.67h-15.104c.162 3.46 2.157 5.74 5.211 5.74 2.402 0 4.03-1.059 5.659-3.542l3.582 2.605c-1.954 3.42-5.129 5.17-9.241 5.17-5.985 0-10.138-4.6-10.138-11.399Zm4.967-2.157h10.219c-.163-3.054-2.036-5.008-5.089-5.008-2.809 0-4.967 2.117-5.13 5.008ZM176.117 41V19.422h4.601v1.873h.081c.937-1.425 2.565-2.28 4.56-2.28.977 0 1.832.122 2.606.367l-.855 4.763c-.896-.244-1.669-.366-2.321-.366-2.524 0-3.786 1.71-3.786 5.13V41h-4.886Zm12.465-10.789c0-6.799 4.275-11.4 10.463-11.4 6.229 0 10.504 4.601 10.504 11.4 0 6.8-4.275 11.4-10.504 11.4-6.188 0-10.463-4.6-10.463-11.4Zm16.082 0c0-4.274-2.077-6.92-5.619-6.92-3.46 0-5.577 2.564-5.577 6.92 0 4.357 2.117 6.921 5.577 6.921 3.542 0 5.619-2.646 5.619-6.92Z"
							/>
							<defs>
								<clipPath id="a">
									<path fill="#fff" d="M0 0h58v58H0z" />
								</clipPath>
							</defs>
						</svg>
					</div> */}

					{/* Main content area */}
					<main
						tw="flex p-24 pb-24 justify-between z-10 flex-col w-full grow items-start"
						style={{
							height: 630,
						}}
					>
						<div tw="flex flex-col h-full justify-between grow items-start">
							<div tw="flex flex-col">
								<div
									tw={`text-[${title && title.length > 43 ? '56px' : '62px'}] text-white max-w-[700px] leading-[1.1] mb-6 font-semibold`}
								>
									{title}
								</div>
								<div
									tw="text-[34px] text-white/75 leading-tight"
									style={{
										fontFamily: 'TextFont',
									}}
								>
									with Kent C. Dodds
								</div>
							</div>
							{discountPercentage ? (
								<div tw="flex items-center justify-center bg-black text-gray-50 px-10 shadow-xl py-5 rounded-lg text-[30px] font-semibold">
									<span tw="text-[40px] mr-5">Save {discountPercentage}%</span>{' '}
									<span
										style={{
											fontFamily: 'TextFont',
										}}
									>
										for a limited time!
									</span>
								</div>
							) : null}
						</div>
					</main>
				</div>
			),
			{
				fonts: [
					{
						name: 'HeadingFont',
						data: BOLD_fontData,
						style: 'normal',
					},
					{
						name: 'TextFont',
						data: LIGHT_fontData,
						style: 'normal',
					},
				],
				debug: false,
				width: 1200,
				height: 630,
			},
		)
	} catch (e: any) {
		return new Response('Failed to generate OG image', { status: 500 })
	}
}
