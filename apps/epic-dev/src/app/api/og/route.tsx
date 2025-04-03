// EXAMPLE USAGE
// with resource: /api/og?resource=[SLUG_OR_ID]
// with custom title: /api/og?title=ANYTHING

import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource, contentResourceResource, products } from '@/db/schema'
import { getVideoResourceForLesson } from '@/lib/lessons-query'
import { PlayIcon } from '@heroicons/react/24/solid'
import { and, asc, eq, or, sql } from 'drizzle-orm'

export const runtime = 'edge'
export const revalidate = 60
// export const contentType = 'image/png'

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const resourceTypesWithImages = [
			'post',
			'list',
			'workshop',
			'tutorial',
			'self-paced',
		]
		const hasResource = searchParams.has('resource')
		const resourceSlugOrID = hasResource ? searchParams.get('resource') : null
		const hasTitle = searchParams.has('title')
		const hasImage = searchParams.has('image')
		let title
		let image = hasImage ? searchParams.get('image') : null
		let muxPlaybackId
		let resource

		if (resourceSlugOrID && !hasTitle) {
			resource = await db.query.contentResource.findFirst({
				extras: {
					fields:
						sql<string>`JSON_REMOVE(${contentResource.fields}, '$.body')`.as(
							'fields',
						),
				},
				where: and(
					or(
						eq(
							sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
							resourceSlugOrID,
						),
						eq(contentResource.id, resourceSlugOrID),
					),
				),
				with: {
					resources: {
						with: {
							resource: {
								extras: {
									fields:
										sql<string>`JSON_REMOVE(${contentResource.fields}, '$.srt', '$.wordLevelSrt', '$.transcript', '$.muxAssetId', '$.originalMediaUrl')`.as(
											'fields',
										),
								},
							},
						},
						orderBy: asc(contentResourceResource.position),
					},
				},
			})

			muxPlaybackId = resource?.resources?.[0]?.resource?.fields?.muxPlaybackId

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
				image =
					resource?.fields?.coverImage?.url ||
					resource.fields?.image ||
					product?.fields?.image?.url ||
					(muxPlaybackId &&
						`https://image.mux.com/${muxPlaybackId}/thumbnail.png?time=${resource?.fields.thumbnailTime || 0}&width=1200`)
			}
		} else {
			if (hasTitle) {
				title = searchParams.get('title')?.slice(0, 100)
			} else {
				title = 'From Zero to AI Hero'
			}
		}

		const fontData = await fetch(
			new URL(
				'../../../../public/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		const seed = resourceSlugOrID || title || 'default-seed'

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full bg-white flex-col"
					style={{
						fontFamily: 'HeadingFont',
						background: '#0D0D0D',
						width: 1200,
						height: 630,
						backgroundImage:
							resource && resource.type === 'post' && image
								? `url(${image})`
								: '',
						backgroundSize: 'contain',
						backgroundPosition: 'center',
					}}
				>
					<div
						style={{
							position: 'absolute',
							width: '100%',
							height: '100%',
							backdropFilter: 'blur(10px)',
							background:
								'linear-gradient(-130deg, rgba(4, 4, 4, 0.4), #040404 50%)',
							zIndex: 1,
						}}
					/>
					{resource && resource.type === 'post' && image && (
						<div tw="absolute right-40 top-26 z-10 flex">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={48}
								height={48}
								viewBox="0 0 12 12"
							>
								<g fill="#fff">
									<path
										d="M11.741,5.562l-10-5.5a.5.5,0,0,0-.5.008A.5.5,0,0,0,1,.5v11a.5.5,0,0,0,.246.43A.491.491,0,0,0,1.5,12a.5.5,0,0,0,.241-.062l10-5.5a.5.5,0,0,0,0-.876Z"
										fill="#fff"
									/>
								</g>
							</svg>
						</div>
					)}
					<main tw="flex p-26 pb-32 relative z-10 flex-row w-full h-full flex-grow items-end justify-between">
						<div
							tw={`${resource?.type === 'post' ? 'text-[62px]' : 'text-[56px]'} min-w-[500px] text-[#EAEAEA] leading-tight pr-16`}
						>
							{title}
						</div>
						{image && resource && resource?.type !== 'post' && (
							<div tw={`flex items-start -mr-32 justify-start h-full`}>
								<div tw="relative flex items-center justify-center">
									<img src={image} width={700} />
									<div tw="absolute z-10 flex">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width={80}
											height={80}
											viewBox="0 0 12 12"
										>
											<g fill="#fff">
												<path
													d="M11.741,5.562l-10-5.5a.5.5,0,0,0-.5.008A.5.5,0,0,0,1,.5v11a.5.5,0,0,0,.246.43A.491.491,0,0,0,1.5,12a.5.5,0,0,0,.241-.062l10-5.5a.5.5,0,0,0,0-.876Z"
													fill="#fff"
												/>
											</g>
										</svg>
									</div>
								</div>
							</div>
						)}
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
			},
		)
	} catch (e: any) {
		return new Response('Failed to generate OG image', { status: 500 })
	}
}
