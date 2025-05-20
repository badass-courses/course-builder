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
			'event',
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
				title = 'Become Epic AI Pro'
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
					tw="flex h-full w-full bg-gradient-to-tr from-purple-200 to-white flex-col"
					style={{
						fontFamily: 'HeadingFont',
						// background: '#fff',
						width: 1200,
						height: 630,
						backgroundImage: resource && image ? `url(${image})` : '',
						backgroundSize: 'contain',
						backgroundPosition: 'center',
					}}
				>
					{resource && image && (
						<div
							tw="absolute w-full h-full"
							style={{
								backgroundImage:
									'linear-gradient(to bottom left, rgba(255,255,255,0.3), rgba(255,255,255,0.7), rgba(255,255,255,0.9))',
							}}
						/>
					)}
					{resource && image && (
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
					<div tw="flex items-center absolute left-24 top-24 justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="219"
							height="55"
							fill="none"
							viewBox="0 0 219 55"
						>
							<path
								fill="#000"
								d="M23.016 12.874v5.051H9.043v6.885h13.484v4.97H9.043v6.965h14.299v5.052H3.096V12.874h19.92Zm5.097 7.333h5.621l.163 4.48-.448-.407c.516-1.466 1.358-2.593 2.526-3.38 1.195-.788 2.62-1.182 4.277-1.182 1.982 0 3.666.502 5.051 1.507 1.412.978 2.472 2.322 3.178 4.033.706 1.684 1.059 3.598 1.059 5.744 0 2.145-.353 4.073-1.06 5.784-.705 1.684-1.765 3.028-3.177 4.033-1.385.978-3.069 1.466-5.051 1.466-1.06 0-2.037-.176-2.933-.53a6.458 6.458 0 0 1-2.322-1.547c-.652-.706-1.168-1.562-1.548-2.566l.53-.326v10.591h-5.866v-27.7Zm5.458 10.795c0 1.249.177 2.376.53 3.38.38 1.006.937 1.82 1.67 2.445.76.597 1.684.896 2.77.896 1.602 0 2.824-.638 3.666-1.914.842-1.277 1.263-2.88 1.263-4.807 0-1.901-.434-3.49-1.303-4.767-.842-1.303-2.05-1.955-3.626-1.955-1.086 0-2.01.313-2.77.937-.733.598-1.29 1.412-1.67 2.444-.353 1.005-.53 2.118-.53 3.34Zm25.947-10.795v21.59h-5.866v-21.59h5.866Zm.122-7.333v4.481h-6.07v-4.48h6.07Zm19.483 15.52c-.163-1.303-.651-2.308-1.466-3.014-.788-.706-1.738-1.06-2.852-1.06-1.575 0-2.797.585-3.666 1.753-.842 1.167-1.263 2.81-1.263 4.929 0 2.118.421 3.76 1.263 4.929.87 1.167 2.091 1.751 3.666 1.751 1.168 0 2.146-.366 2.933-1.1.815-.733 1.317-1.792 1.508-3.177l6.07.245c-.19 1.738-.761 3.258-1.712 4.562-.95 1.303-2.2 2.308-3.747 3.014-1.521.706-3.205 1.06-5.052 1.06-2.2 0-4.128-.462-5.784-1.386-1.657-.923-2.933-2.24-3.83-3.95-.895-1.712-1.344-3.694-1.344-5.948 0-2.255.449-4.237 1.345-5.948.896-1.71 2.172-3.028 3.829-3.951 1.656-.924 3.585-1.385 5.784-1.385 1.793 0 3.45.34 4.97 1.018 1.521.68 2.743 1.657 3.666 2.933.95 1.25 1.521 2.716 1.711 4.4l-6.029.326Zm86.42-15.52c2.254 0 4.209.38 5.866 1.14 1.656.761 2.933 1.847 3.829 3.26.896 1.385 1.344 3.041 1.344 4.97 0 1.928-.448 3.611-1.344 5.05-.896 1.413-2.173 2.5-3.829 3.26-1.657.76-3.612 1.14-5.866 1.14h-5.5v10.103h-5.947V12.874h11.447Zm-.326 13.769c1.711 0 3.014-.367 3.911-1.1.896-.76 1.344-1.86 1.344-3.3 0-1.439-.448-2.512-1.344-3.218-.897-.733-2.2-1.1-3.911-1.1h-5.174v8.718h5.174Zm21.226-6.436.204 6.232-.408-.204c.272-2.036.856-3.543 1.752-4.521.896-1.005 2.159-1.507 3.788-1.507h1.996v4.44h-2.036c-1.168 0-2.119.19-2.852.57-.733.353-1.276.91-1.629 1.67-.326.733-.489 1.67-.489 2.811v12.099h-5.866v-21.59h5.54Zm19.909 22.078c-2.199 0-4.128-.461-5.784-1.384-1.657-.924-2.933-2.241-3.829-3.952-.897-1.71-1.345-3.693-1.345-5.947 0-2.255.448-4.237 1.345-5.948.896-1.71 2.172-3.028 3.829-3.951 1.656-.924 3.585-1.385 5.784-1.385 2.173 0 4.088.461 5.744 1.385 1.657.923 2.933 2.24 3.829 3.951.924 1.711 1.385 3.694 1.385 5.948 0 2.254-.461 4.236-1.385 5.947-.896 1.711-2.172 3.028-3.829 3.952-1.656.923-3.571 1.384-5.744 1.384Zm0-4.603c1.575 0 2.784-.584 3.626-1.751.869-1.168 1.303-2.811 1.303-4.93 0-2.118-.434-3.76-1.303-4.928-.842-1.168-2.051-1.752-3.626-1.752-1.575 0-2.797.584-3.666 1.752-.842 1.167-1.263 2.81-1.263 4.929 0 2.118.421 3.76 1.263 4.929.869 1.167 2.091 1.751 3.666 1.751Z"
							/>
							<rect
								width="53.9"
								height="50.306"
								x="90.026"
								y="4.078"
								fill="#7C3BED"
								rx="8.983"
								transform="rotate(-3.934 90.026 4.078)"
							/>
							<path
								fill="#fff"
								d="m107.432 13.603 6.787-.467 12.388 28.139-6.015.413-2.63-6.188-11.176.768-1.759 6.49-6.015.414 8.42-29.57Zm8.523 17.053-4.728-11.149-3.116 11.688 7.844-.539Zm18.647-18.922 1.985 28.855-5.934.408-1.984-28.855 5.933-.408Z"
							/>
						</svg>
					</div>
					<main tw="flex p-26 pb-32 relative z-10 flex-row w-full h-full flex-grow items-end justify-between">
						<div
							tw={`${resource?.type === 'post' ? 'text-[62px]' : 'text-[56px]'} min-w-[500px] text-black leading-tight pr-16`}
						>
							{title}
						</div>
						{image && resource && resource?.type !== 'post' && (
							<div tw={`flex items-start -mr-32 justify-start h-full`}>
								<div tw="relative flex items-center justify-center">
									{/* <img src={image} width={700} /> */}
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
