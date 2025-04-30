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

async function loadGoogleFont(font: string, text: string) {
	const url = `https://fonts.googleapis.com/css2?family=${font}:wght@600&text=${encodeURIComponent(text)}`
	const css = await (await fetch(url)).text()
	const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

	if (resource) {
		const response = await fetch(resource[1] as any)
		if (response.status == 200) {
			return await response.arrayBuffer()
		}
	}

	throw new Error('failed to load font data')
}

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

		const titleLengthLimit = 60

		const titleTruncated =
			title?.length > titleLengthLimit
				? `${title?.slice(0, titleLengthLimit)}...`
				: title

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full bg-white flex-col text-white"
					style={{
						fontFamily: 'HeadingFont',
						background: '#1F1F22',
						width: 1200,
						height: 630,
						// backgroundImage:
						// 	resource && resource.type === 'post' && image
						// 		? `url(${image})`
						// 		: '',
						backgroundSize: 'contain',
						backgroundPosition: 'center',
					}}
				>
					{resource && resource.type === 'post' && image && (
						<img src={image} tw="object-contain absolute w-full h-full" />
					)}
					{resource && resource.type === 'post' && image && (
						<div tw="absolute w-full h-full bg-white/80" />
					)}
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
					<div tw="w-full absolute left-24 bottom-28 flex">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="621"
							height="2"
							fill="none"
							viewBox="0 0 621 2"
						>
							<path
								stroke="#fff"
								stroke-dasharray="1 23"
								stroke-linecap="round"
								stroke-width="2"
								d="M1 1h619"
								opacity=".5"
							/>
						</svg>
					</div>
					<div tw="flex items-center absolute right-24 bottom-24 justify-center text-5xl font-bold">
						<div tw="text-foreground flex items-end gap-1.5 font-bold tracking-tight">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={20 * 2.3}
								height={16 * 2.3}
								fill="none"
								viewBox="0 0 20 16"
							>
								<path fill="#fff" d="M.5 0H20L10 15.5v-10L.5 0Z" opacity=".5" />
								<path fill="#fff" d="M20 0 10 5.5.5 0H20Z" />
							</svg>
							<span tw="pl-4">The Craft of UI</span>
						</div>
					</div>
					<main tw="flex p-26 pt-28 relative z-10 flex-row w-full h-full flex-grow items-start justify-between">
						<div tw={`text-[64px] min-w-[500px] leading-tight pr-24 flex`}>
							<span tw="flex pr-8 text-[#EE762F]"># </span>
							<span>{titleTruncated}</span>
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
						data: await loadGoogleFont(
							'Geist Mono',
							`The Craft of UI ${title}`,
						),
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
