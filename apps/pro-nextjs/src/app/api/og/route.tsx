// EXAMPLE USAGE
// with resource: https://pronextjs.dev/api/og?resource=[SLUG_OR_ID]
// with custom title: https://pronextjs.dev/api/og?title=ANYTHING

import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource, coupon, products } from '@/db/schema'
import { and, desc, eq, gte, or, sql } from 'drizzle-orm'

export const runtime = 'edge'
export const revalidate = 60
// export const contentType = 'image/png'

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const resourceTypesWithImages = ['workshop', 'tutorial', 'self-paced']
		const hasResource = searchParams.has('resource')
		const resourceSlugOrID = hasResource ? searchParams.get('resource') : null
		const hasTitle = searchParams.has('title')
		let title
		let image
		if (resourceSlugOrID && !hasTitle) {
			let resource = await db.query.contentResource.findFirst({
				where: and(
					or(
						eq(
							sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
							resourceSlugOrID,
						),
						eq(contentResource.id, resourceSlugOrID),
					),
				),
			})
			let product
			if (!resource) {
				product = await db.query.products.findFirst({
					where: and(
						or(
							eq(
								sql`JSON_EXTRACT (${products.fields}, "$.slug")`,
								resourceSlugOrID,
							),
							eq(products.id, resourceSlugOrID),
						),
					),
				})
			}

			title = resource?.fields?.title || product?.name

			if (resource && resourceTypesWithImages.includes(resource.type)) {
				image = resource?.fields?.coverImage?.url || product?.fields?.image?.url
			}
		} else {
			if (hasTitle) {
				title = searchParams.get('title')?.slice(0, 100)
			} else {
				title = 'The No-BS Solution for Enterprise-Ready Next.js Applications'
			}
			if (searchParams.has('image')) {
				image = searchParams.get('image')
			}
		}

		const activeSaleCoupon = await db.query.coupon.findFirst({
			where: and(
				eq(coupon.status, 1),
				eq(coupon.default, true),
				gte(coupon.expires, new Date()),
			),
			orderBy: desc(coupon.percentageDiscount),
		})

		const fontData = await fetch(
			new URL(
				'../../../../public/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full bg-white flex-col"
					style={{
						fontFamily: 'Maison',
						background: 'linear-gradient(105deg, #FFF 0.91%, #F7F7F9 100%)',
						width: 1200,
						height: 630,
					}}
				>
					<div tw="flex items-center justify-center absolute left-26 top-26">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={30 * 2.6}
							height={26 * 2.6}
							fill="none"
							viewBox="0 0 30 26"
						>
							<path
								fill={'#262C30'}
								d="m.56 15.002 5.012 8.696A4.205 4.205 0 0 0 9.206 25.8h4.388L2.754 6.99.56 10.8a4.222 4.222 0 0 0 0 4.203Zm28.88-4.203-5.012-8.697A4.206 4.206 0 0 0 20.794 0h-4.388l10.84 18.809L29.44 15a4.221 4.221 0 0 0 0-4.202Zm-2.762 8.984a3.835 3.835 0 0 1-1.817.454 3.877 3.877 0 0 1-3.346-1.936l-9.506-16.49A3.578 3.578 0 0 0 8.877 0a3.579 3.579 0 0 0-3.132 1.812L3.322 6.017a3.837 3.837 0 0 1 1.817-.454c1.375 0 2.657.742 3.346 1.936l9.506 16.49a3.579 3.579 0 0 0 3.132 1.811 3.578 3.578 0 0 0 3.132-1.812l2.423-4.205Z"
							/>
						</svg>
					</div>
					<main tw="flex p-26 pb-32 flex-row w-full h-full flex-grow items-end justify-between">
						<div tw="flex flex-col items-start pr-10 max-w-xl">
							<div
								tw="text-[54px] text-[#262C30]"
								style={{
									lineHeight: 1,
								}}
							>
								{title}
							</div>
							{activeSaleCoupon && (
								<div tw="flex mt-16 items-center">
									<div tw="flex border border-[#262C30] flex-col text-4xl font-bold bg-[#262C30] px-5 py-2 text-white rounded-l">
										{Number(activeSaleCoupon.percentageDiscount) * 100}% off
									</div>
									<div tw="flex flex-col text-4xl font-bold border border-[#262C30] px-5 py-2 rounded-r">
										Limited Offer
									</div>
								</div>
							)}
						</div>
						{image && (
							<div tw="flex -mb-10 -mr-5 flex-shrink-0">
								<img src={image} width={450} height={450} />
							</div>
						)}
					</main>
					{activeSaleCoupon && (
						<svg
							style={{
								position: 'absolute',
							}}
							width="1200"
							height="630"
							viewBox="0 0 1200 630"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<g clipPath="url(#clip0_260_259)">
								<rect
									x="1046.63"
									y="-81"
									width="320"
									height="59.6054"
									rx="4.35548"
									transform="rotate(45 1046.63 -81)"
									fill="#262C30"
								/>
								<path
									d="M1114.11 33.2434L1117.8 35.6299C1116.02 38.2047 1116.04 39.9004 1117.98 41.8472C1119.43 43.2917 1120.77 43.5848 1121.69 42.6637C1122.72 41.6379 1122.53 40.4447 1120.91 37.158C1119.78 34.8972 1119.2 33.055 1119.18 31.6524C1119.16 30.2499 1119.7 28.9938 1120.77 27.9262C1123.22 25.4769 1126.96 25.8328 1129.87 28.7426C1132.74 31.6106 1133.24 35.588 1131.13 38.6234L1127.47 36.2579C1128.56 34.3738 1128.43 32.8666 1127.09 31.5268C1125.94 30.3755 1124.66 30.1452 1123.85 30.9616C1123.09 31.7152 1123.3 32.7619 1124.75 35.6717C1125.94 38.121 1126.55 40.1097 1126.55 41.6588C1126.55 43.2079 1125.98 44.5686 1124.79 45.7619C1122.25 48.2949 1118.36 47.7925 1115.16 44.5896C1111.66 41.0936 1111.29 37.1162 1114.11 33.2434ZM1131.01 59.8136L1132.52 56.7572L1126.91 51.147L1123.85 52.6542L1120.77 49.5769L1140.66 40.1567L1143.51 43.0037L1134.09 62.8909L1131.01 59.8136ZM1130.57 49.3676L1134.3 53.0938L1137.86 45.8507L1137.81 45.8088L1130.57 49.3676ZM1135.43 64.2302L1150.08 49.5764L1153.18 52.6746L1141.37 64.4814L1147.57 70.6778L1144.72 73.5248L1135.43 64.2302ZM1146.67 75.474L1161.32 60.8202L1170.77 70.2614L1167.92 73.1084L1161.58 66.7655L1158.6 69.7381L1164.38 75.5158L1161.66 78.2372L1155.88 72.4595L1152.62 75.7252L1158.98 82.0891L1156.13 84.9361L1146.67 75.474Z"
									fill="white"
								/>
							</g>
							<defs>
								<clipPath id="clip0_260_259">
									<rect width="1200" height="630" fill="white" />
								</clipPath>
							</defs>
						</svg>
					)}
				</div>
			),
			{
				fonts: [
					{
						name: 'Maison',
						data: fontData,
						style: 'normal',
					},
				],
			},
		)
	} catch (e: any) {
		return new Response('Failed to generate OG image', { status: 500 })
	}
}
