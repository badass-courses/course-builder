// EXAMPLE USAGE
// with resource: /api/og?resource=[SLUG_OR_ID]
// with custom title: /api/og?title=ANYTHING

import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource, products } from '@/db/schema'
import { and, eq, or, sql } from 'drizzle-orm'

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
				title = 'Build apps you can use anywhere'
			}
		}

		const fontData = await fetch(
			new URL(
				'../../../../public/fonts/Gabarito-Medium-BF651cdf1f3f18e.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		// const seed = resourceSlugOrID || title || 'default-seed'

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full bg-white flex-col"
					style={{
						fontFamily: 'Gabarito',
						background: '#B4C7E0',
						// background: '#f5f5f5',
						width: 1200,
						height: 630,
					}}
				>
					<div tw="flex items-center justify-center absolute left-26 top-26">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={79 * 2}
							height={39 * 2}
							fill="none"
							viewBox="0 0 79 39"
						>
							<path
								fill="#111"
								d="M59.886 38.229C70.442 38.229 79 29.67 79 19.115 79 8.557 70.442 0 59.886 0 49.328 0 40.77 8.558 40.77 19.114c0 10.557 8.558 19.115 19.114 19.115ZM17.208.009C7.545.964 0 9.117 0 19.028c0 10.556 8.559 19.114 19.114 19.114 9.911 0 18.064-7.545 19.02-17.208.105-1.051-.76-1.906-1.816-1.906H21.026a1.91 1.91 0 0 1-1.912-1.912V1.825c0-1.057-.855-1.921-1.906-1.816Z"
							/>
						</svg>
					</div>
					<main tw="flex p-24 pb-32 relative z-10 flex-row w-full h-full flex-grow items-end justify-between">
						<div tw="text-[62px] text-[#0F1115] leading-tight pr-24">
							{title}
						</div>
						{image && (
							<div tw="flex -mb-10 -mr-5">
								<img src={image} width={450} height={450} />
							</div>
						)}
					</main>
				</div>
			),
			{
				fonts: [
					{
						name: 'Gabarito',
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
