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
				'../../../../public/fonts/calluna_900_normal.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		const seed = resourceSlugOrID || title || 'default-seed'

		const squareGridPattern = generateGridPattern(seed)

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
								'linear-gradient(-130deg, rgba(4, 4, 4, 0.4), #040404 50%)',
							zIndex: 1,
						}}
					/>
					{resource && resource.type === 'post' && image && (
						<div tw="absolute right-40 top-28 z-10 flex">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={72}
								height={72}
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
					<div tw="flex items-center justify-center absolute left-26 top-26">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={138 * 1.7}
							height={50 * 1.7}
							fill="none"
							viewBox="0 0 138 50"
						>
							<path
								fill="#FFAB49"
								fillRule="evenodd"
								d="M10.768 17.24a2.796 2.796 0 0 0-.202 1.043v2.24a1.4 1.4 0 0 0 1.4-1.4v-.84c0-.062.004-.123.012-.183.03-.23.003-.455-.071-.66.214-.037.422-.126.607-.267a1.44 1.44 0 0 1 .152-.102l.727-.42a1.4 1.4 0 0 0 .513-1.912l-1.94 1.12a2.8 2.8 0 0 0-1.198 1.382Zm5.076-3.62a1.4 1.4 0 0 0 1.912.512l1.454-.84a1.4 1.4 0 0 0 .513-1.912l-3.88 2.24Zm5.816-3.359a1.4 1.4 0 0 0 1.913.513l.727-.42c.053-.03.108-.058.164-.081A1.4 1.4 0 0 0 25 9.881c.14.167.32.303.536.392.055.023.11.05.164.081l.727.42a1.4 1.4 0 0 0 1.913-.513l-1.94-1.12a2.807 2.807 0 0 0-1.796-.346 2.796 2.796 0 0 0-1.004.347l-1.94 1.12Zm8.617 1.12a1.4 1.4 0 0 0 .513 1.912l1.454.84a1.4 1.4 0 0 0 1.912-.513l-3.879-2.24Zm5.817 3.358a1.4 1.4 0 0 0 .513 1.912l.727.42a1.4 1.4 0 0 1 .152.102c.185.141.393.23.607.268a1.389 1.389 0 0 0-.071.66c.008.06.012.12.012.182v.84a1.4 1.4 0 0 0 1.4 1.4v-2.24a2.803 2.803 0 0 0-1.4-2.425l-1.94-1.12Zm3.34 8.021a1.4 1.4 0 0 0-1.4 1.4v1.68a1.4 1.4 0 0 0 1.4 1.4v-4.48Zm0 6.717a1.4 1.4 0 0 0-1.4 1.4v.84c0 .062-.004.123-.012.183-.03.23-.003.455.071.66a1.392 1.392 0 0 0-.607.267 1.4 1.4 0 0 1-.152.102l-.727.42a1.4 1.4 0 0 0-.513 1.912l1.94-1.12a2.802 2.802 0 0 0 1.4-2.424v-2.24Zm-5.278 6.903a1.4 1.4 0 0 0-1.912-.512l-1.454.84a1.4 1.4 0 0 0-.513 1.912l3.88-2.24Zm-5.816 3.36a1.4 1.4 0 0 0-1.913-.513l-.727.42a1.4 1.4 0 0 1-.164.081 1.394 1.394 0 0 0-.536.392 1.394 1.394 0 0 0-.536-.392 1.393 1.393 0 0 1-.164-.081l-.727-.42a1.4 1.4 0 0 0-1.913.513l1.94 1.12a2.794 2.794 0 0 0 2.471.161c.112-.046.222-.1.329-.162l1.94-1.12Zm-8.617-1.12a1.4 1.4 0 0 0-.513-1.912l-1.454-.84a1.4 1.4 0 0 0-1.912.513l3.879 2.24Zm-5.817-3.358a1.4 1.4 0 0 0-.513-1.912l-.727-.42a1.408 1.408 0 0 1-.152-.102 1.392 1.392 0 0 0-.607-.267c.074-.205.101-.43.071-.66a1.402 1.402 0 0 1-.012-.183v-.84a1.4 1.4 0 0 0-1.4-1.4v2.24a2.805 2.805 0 0 0 1.4 2.425l1.94 1.12Zm-3.34-8.021a1.4 1.4 0 0 0 1.4-1.4v-1.68a1.4 1.4 0 0 0-1.4-1.4v4.48Z"
								clip-rule="evenodd"
								opacity=".2"
							/>
							<path
								fill="#E2C4A1"
								fillRule="evenodd"
								d="m25 0 25 25-25 25L0 25 25 0ZM1.98 25 25 48.02 48.02 25 25 1.98 1.98 25Z"
								clipRule="evenodd"
							/>
							<path
								fill="#E2C4A1"
								fillRule="evenodd"
								d="m25 19.95-4.373 2.525v5.05L25 30.05l4.374-2.525v-5.05L25 19.95Zm5.774 1.716L25 18.333l-5.773 3.333v6.667L25 31.666l5.774-3.333v-6.667Z"
								clipRule="evenodd"
							/>
							<path
								fill="#E2C4A1"
								fillRule="evenodd"
								d="M25 47.13c12.221 0 22.129-9.908 22.129-22.13S37.221 2.87 24.999 2.87C12.779 2.87 2.87 12.779 2.87 25S12.778 47.13 25 47.13Zm0 1.4c12.995 0 23.529-10.535 23.529-23.53 0-12.995-10.534-23.53-23.53-23.53C12.006 1.47 1.47 12.006 1.47 25c0 12.995 10.535 23.53 23.53 23.53Z"
								clipRule="evenodd"
							/>
							<path
								fill="#E2C4A1"
								d="m70.225 29.454-.79-2.587h-5.509l-.79 2.587a3.219 3.219 0 0 0-.144.838c0 .694.527.838 1.748.886v.838h-5.124v-.838c1.149-.096 1.532-.455 2.06-2.06l4.406-13.603h2.131l4.359 13.555c.43 1.342.766 2.012 2.011 2.108v.838h-5.867v-.838c1.15-.048 1.629-.311 1.629-1.006 0-.24-.072-.55-.12-.718Zm-4.838-7.28-1.102 3.544H69.1l-1.078-3.545a72.86 72.86 0 0 1-1.245-4.574h-.096c-.263.958-.622 2.395-1.293 4.574Zm12.387 7.184V18.174c0-1.365-.311-1.773-1.916-1.82v-.839h6.107v.839c-1.604.047-1.916.455-1.916 1.82v11.184c0 1.365.312 1.772 1.916 1.82v.838h-6.107v-.838c1.605-.048 1.916-.455 1.916-1.82Zm22.337 0v-5.485H93.31v5.485c0 1.365.311 1.772 1.916 1.82v.838h-6.107v-.838c1.605-.048 1.916-.455 1.916-1.82V18.174c0-1.365-.311-1.773-1.916-1.82v-.839h6.107v.839c-1.605.047-1.916.455-1.916 1.82v4.502h6.801v-4.502c0-1.365-.31-1.773-1.915-1.82v-.839h6.107v.839c-1.605.047-1.916.455-1.916 1.82v11.184c0 1.365.311 1.772 1.916 1.82v.838h-6.107v-.838c1.604-.048 1.915-.455 1.915-1.82Zm11.765 1.485c1.03 0 2.347-.455 3.185-1.006l.503.814c-1.149.886-2.562 1.629-4.263 1.629-3.424 0-5.484-2.3-5.484-6.227 0-3.904 2.203-6.179 5.149-6.179 3.018 0 4.79 2.084 4.79 5.724v.646h-7.64c.048 3.473 1.246 4.599 3.76 4.599Zm-.958-9.82c-1.628 0-2.61.983-2.778 4.048h5.341c0-2.922-.743-4.047-2.563-4.047Zm10.068 1.653c.934-1.652 1.964-2.802 3.257-2.802.264 0 .527.048.719.12l-.527 2.37c-.168-.071-.383-.119-.742-.119-1.964 0-2.611.766-2.611 3.09v4.19c0 1.366.24 1.605 2.036 1.677v.814h-5.892v-.814c1.365-.096 1.677-.312 1.677-1.677v-5.867c0-1.748-.336-1.988-1.749-2.036v-.718l3.066-.958h.359c.168.407.407 1.413.407 2.73Zm15.914 3.545c0 3.807-2.323 6.082-5.508 6.082-3.209 0-5.508-2.299-5.508-6.202 0-3.88 2.299-6.203 5.46-6.203 3.544 0 5.556 2.706 5.556 6.323Zm-2.347.095c0-3.664-1.125-5.244-3.209-5.244-2.395 0-3.113 1.82-3.113 4.79 0 3.616.862 5.268 3.209 5.268 2.059 0 3.113-1.724 3.113-4.814Z"
							/>
						</svg>
					</div>
					<main tw="flex p-26 pb-32 relative z-10 flex-row w-full h-full flex-grow items-end justify-between">
						<div
							tw={`${resource?.type === 'post' ? 'text-[62px]' : 'text-[62px]'} min-w-[500px] text-[#EAEAEA] leading-tight pr-24`}
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
