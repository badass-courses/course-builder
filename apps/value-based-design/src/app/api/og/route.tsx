// EXAMPLE USAGE
// with resource: https://pronextjs.dev/api/og?resource=[SLUG_OR_ID]
// with custom title: https://pronextjs.dev/api/og?title=ANYTHING

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
		const resourceTypesWithImages = ['workshop', 'tutorial']
		const hasResource = searchParams.has('resource')
		const resourceSlugOrID = hasResource ? searchParams.get('resource') : null
		const hasTitle = searchParams.has('title')
		let title
		let image
		if (resourceSlugOrID && !hasTitle) {
			const resource = await db.query.contentResource.findFirst({
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
		}

		const fontDataMaison = await fetch(
			new URL(
				'../../../../public/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())
		const fontDataBrabo = await fetch(
			new URL(
				'../../../../public/fonts/FSBraboWeb-SemiBd.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full bg-white flex-col"
					style={{
						background: '#fafafa',
						width: 1200,
						height: 630,
					}}
				>
					<div
						style={{
							fontFamily: 'Maison',
						}}
						tw="flex items-center gap-2 justify-center absolute bg-black text-4xl text-white px-4 py-1.5 left-26 top-26"
					>
						Value-Based Design
					</div>
					<main
						tw="flex p-26 pb-32 flex-row w-full gap-5 h-full flex-grow items-end justify-between"
						style={{
							fontFamily: 'Brabo',
						}}
					>
						<div tw="text-[54px] text-[#262C30] leading-tight">{title}</div>
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
						name: 'Maison',
						data: fontDataMaison,
						style: 'normal',
					},
					{
						name: 'Brabo',
						data: fontDataBrabo,
						style: 'normal',
					},
				],
			},
		)
	} catch (e: any) {
		return new Response('Failed to generate OG image', { status: 500 })
	}
}
