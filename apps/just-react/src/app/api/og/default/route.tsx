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
		const title = hasTitle ? searchParams.get('title') : 'Just React'

		// Get the font for text rendering
		const fontData = await fetch(
			new URL(
				'../../../../../public/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.ttf',
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
					or(isNull(coupon.expires), gte(coupon.expires, now)), // not expired
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

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full flex-col relative"
					style={{
						fontFamily: 'HeadingFont',
						background: '#F5F3EA',
						width: 1200,
						height: 630,
						color: '#05118B',
					}}
				>
					{/* Main content area */}
					<main tw="flex p-26 pb-32 relative z-10 flex-col w-full h-full grow items-start justify">
						<div tw="flex flex-col items-start">
							<div tw="text-[72px] max-w-[600px] leading-tight mb-4 font-bold">
								{title}
							</div>
							<div tw="text-[36px] text-white/75 max-w-[600px] leading-tight mb-12">
								with Matt Pocock
							</div>

							{discountPercentage ? (
								<div tw="flex items-center justify-center bg-[#05118B] text-white px-10 py-5 rounded-md text-[38px] font-bold">
									<span tw="text-[50px] mr-5">Save {discountPercentage}%</span>{' '}
									for a limited time!
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
						data: fontData,
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
