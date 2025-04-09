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
						background: '#fff',
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
					<div tw="flex items-center absolute left-24 top-24 justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="227"
							height="55"
							fill="none"
							viewBox="0 0 227 55"
						>
							<path
								fill="#000"
								d="M23.016 13.874v5.051H9.043v6.885h13.484v4.97H9.043v6.965h14.299v5.052H3.096V13.874h19.92Zm5.097 7.333h5.621l.163 4.48-.448-.407c.516-1.466 1.358-2.593 2.526-3.38 1.195-.788 2.62-1.182 4.277-1.182 1.982 0 3.666.502 5.051 1.507 1.412.978 2.472 2.322 3.178 4.033.706 1.684 1.059 3.598 1.059 5.744 0 2.145-.353 4.073-1.06 5.784-.705 1.684-1.765 3.028-3.177 4.033-1.385.978-3.069 1.466-5.051 1.466-1.06 0-2.037-.176-2.933-.53a6.458 6.458 0 0 1-2.322-1.547c-.652-.706-1.168-1.562-1.548-2.566l.53-.326v10.591h-5.866v-27.7Zm5.458 10.795c0 1.249.177 2.376.53 3.38.38 1.006.937 1.82 1.67 2.445.76.597 1.684.896 2.77.896 1.602 0 2.824-.638 3.666-1.914.842-1.277 1.263-2.88 1.263-4.807 0-1.901-.434-3.49-1.303-4.767-.842-1.303-2.05-1.955-3.626-1.955-1.086 0-2.01.313-2.77.937-.733.598-1.29 1.412-1.67 2.444-.353 1.005-.53 2.118-.53 3.34Zm25.947-10.795v21.59h-5.866v-21.59h5.866Zm.122-7.333v4.481h-6.07v-4.48h6.07Zm19.483 15.52c-.163-1.303-.651-2.308-1.466-3.014-.788-.706-1.738-1.06-2.852-1.06-1.575 0-2.797.585-3.666 1.753-.842 1.167-1.263 2.81-1.263 4.929 0 2.118.421 3.76 1.263 4.929.87 1.167 2.091 1.751 3.666 1.751 1.168 0 2.146-.366 2.933-1.1.815-.733 1.317-1.792 1.508-3.177l6.07.245c-.19 1.738-.761 3.258-1.712 4.562-.95 1.303-2.2 2.308-3.747 3.014-1.521.706-3.205 1.06-5.052 1.06-2.2 0-4.128-.462-5.784-1.386-1.657-.923-2.933-2.24-3.83-3.95-.895-1.712-1.344-3.694-1.344-5.948 0-2.255.449-4.237 1.345-5.948.896-1.71 2.172-3.028 3.829-3.951 1.656-.924 3.585-1.385 5.784-1.385 1.793 0 3.45.34 4.97 1.018 1.521.68 2.743 1.657 3.666 2.933.95 1.25 1.521 2.716 1.711 4.4l-6.029.326Zm20.355-15.52c4.671 0 8.256 1.263 10.755 3.789 2.525 2.498 3.788 6.07 3.788 10.713 0 4.617-1.236 8.174-3.707 10.673-2.471 2.498-6.002 3.748-10.591 3.748H89.62V13.874h9.858Zm0 23.871c2.879 0 5.011-.774 6.396-2.322 1.412-1.547 2.118-3.897 2.118-7.047 0-3.204-.706-5.58-2.118-7.129-1.385-1.548-3.517-2.322-6.396-2.322h-3.91v18.82h3.91Zm17.916-5.743c0-2.255.448-4.237 1.344-5.948.896-1.71 2.173-3.028 3.829-3.951 1.657-.924 3.572-1.385 5.744-1.385 1.983 0 3.762.448 5.337 1.344 1.575.896 2.81 2.227 3.707 3.992.923 1.738 1.385 3.843 1.385 6.314l.04 1.182h-15.276c.109 1.656.584 2.96 1.426 3.91.842.924 1.969 1.385 3.381 1.385.951 0 1.806-.244 2.567-.733a4.264 4.264 0 0 0 1.67-2.037l5.907.448c-.652 2.064-1.902 3.707-3.748 4.93-1.82 1.221-3.952 1.832-6.396 1.832-2.172 0-4.087-.461-5.744-1.384-1.656-.924-2.933-2.241-3.829-3.952-.896-1.71-1.344-3.693-1.344-5.947Zm15.398-2.119c-.19-1.602-.692-2.783-1.507-3.544-.788-.787-1.779-1.181-2.974-1.181-1.33 0-2.417.42-3.259 1.263-.814.814-1.317 1.969-1.507 3.462h9.247Zm21.515 12.914h-6.233l-7.984-21.59h5.744l5.336 15.683 5.377-15.683h5.744l-7.984 21.59Z"
							/>
							<rect
								width="53.9"
								height="50.306"
								x="168.911"
								y="4.078"
								fill="#7C3BED"
								rx="8.983"
								transform="rotate(-3.934 168.911 4.078)"
							/>
							<path
								fill="#fff"
								d="m186.317 13.603 6.787-.467 12.388 28.139-6.015.413-2.63-6.188-11.176.768-1.759 6.49-6.014.414 8.419-29.57Zm8.523 17.053-4.728-11.149-3.116 11.688 7.844-.539Zm18.648-18.922 1.984 28.855-5.934.408-1.984-28.855 5.934-.408Z"
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
