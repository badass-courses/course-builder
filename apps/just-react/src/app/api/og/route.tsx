// EXAMPLE USAGE
// with resource: /api/og?resource=[SLUG_OR_ID]
// with custom title: /api/og?title=ANYTHING

import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource, contentResourceResource, products } from '@/db/schema'
import { getVideoResourceForLesson } from '@/lib/lessons-query'
import { generateGridPattern } from '@/utils/generate-grid-pattern'
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
										sql<string>`JSON_REMOVE(${contentResource.fields}, '$.body', '$.srt', '$.wordLevelSrt', '$.transcript', '$.muxAssetId', '$.originalMediaUrl')`.as(
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

		const squareGridPattern = generateGridPattern(seed)

		if (resource?.type === 'cohort' && resource?.fields?.image) {
			return new ImageResponse(
				(
					<img
						src={resource?.fields?.image}
						style={{
							width: 1200,
							height: 630,
						}}
					/>
				),
				{
					width: 1200,
					height: 630,
				},
			)
		}

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full bg-white flex-col"
					style={{
						fontFamily: 'HeadingFont',
						color: 'black',
						background: '#FADF0C',
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
					{(resource && resource.type !== 'post') || !image ? (
						<>
							<img
								src={squareGridPattern}
								style={{
									position: 'absolute',
									width: 1200,
									height: 800,
									// objectFit: 'cover',
									zIndex: 0,
									transform:
										'skewY(10deg) skewX(-20deg) translateX(20%) translateY(-15%)',
									perspective: '1000px',
									transformStyle: 'preserve-3d',
								}}
							/>
						</>
					) : null}
					<div
						style={{
							position: 'absolute',
							width: '100%',
							height: '100%',
							backdropFilter: 'blur(10px)',
							background:
								'linear-gradient(-130deg, rgba(250, 223, 12, 0.4), #FADF0C 50%)',
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
								<g fill="#000">
									<path
										d="M11.741,5.562l-10-5.5a.5.5,0,0,0-.5.008A.5.5,0,0,0,1,.5v11a.5.5,0,0,0,.246.43A.491.491,0,0,0,1.5,12a.5.5,0,0,0,.241-.062l10-5.5a.5.5,0,0,0,0-.876Z"
										fill="#000"
									/>
								</g>
							</svg>
						</div>
					)}
					<div tw="flex items-center justify-center absolute left-26 top-26">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={309 / 2}
							height={137 / 2}
							fill="none"
							viewBox="0 0 309 137"
						>
							<path
								fill="#000"
								d="M80.444 39.015 89.548 0h25.824L84.346 133.764H58.522l4.459-18.95c-18.393 12.819-35.113 21.737-45.517 21.737C6.502 136.551 0 129.677 0 118.902c0-2.787.372-6.317 1.486-11.333L9.29 74.314c6.131-26.382 16.35-35.3 41.987-35.3h29.168Zm-41.43 19.507L26.196 114.07c11.333-4.459 27.682-14.862 42.73-25.638l7.06-29.911h-36.97ZM195.93 92.335l-66.696 5.573-4.273 18.764c20.436-2.043 38.643-5.202 62.981-9.661l-.929 22.48c-19.508 3.344-43.66 7.06-54.621 7.06-18.392 0-29.539-8.546-29.539-27.496 0-4.645.743-10.032 2.229-16.163l3.344-14.12c7.431-31.211 20.808-42.544 53.32-42.544 26.196 0 39.2 11.333 39.2 32.14 0 7.99-1.857 16.72-5.016 23.967Zm-20.436-16.721 4.087-17.65c-6.874-.557-15.048-.928-20.993-.928-5.388 0-11.705.185-20.251.928l-4.83 21.366 41.987-3.716Zm92.634-26.939 18.764-17.092C304.727 47.375 309 53.691 309 62.238c0 10.59-10.218 26.938-26.381 44.588-17.464 19.135-34.556 29.725-46.632 29.725-10.218 0-16.535-6.874-16.535-16.72 0-2.601.372-7.246 1.301-14.863l5.573-46.446h-22.851l4.83-19.507h44.774l-9.289 72.084c7.803-5.574 15.977-13.005 22.665-20.622 6.874-7.618 12.82-15.606 18.393-26.196l-16.72-15.606Z"
							/>
						</svg>
					</div>
					<main tw="flex p-26 pb-32 relative z-10 flex-row w-full h-full grow items-end justify-between">
						<div
							tw={`${resource?.type === 'post' ? 'text-[62px]' : resource?.type === 'workshop' ? 'text-[42px]' : 'text-[56px]'} min-w-[500px] text-black leading-tight pr-16`}
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
											<g fill="#000">
												<path
													d="M11.741,5.562l-10-5.5a.5.5,0,0,0-.5.008A.5.5,0,0,0,1,.5v11a.5.5,0,0,0,.246.43A.491.491,0,0,0,1.5,12a.5.5,0,0,0,.241-.062l10-5.5a.5.5,0,0,0,0-.876Z"
													fill="#000"
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
