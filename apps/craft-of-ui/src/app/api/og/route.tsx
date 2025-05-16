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

async function loadFonts() {
	try {
		const interFont = await fetch(
			'https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap',
		).then((res) => res.text())
		const interUrl = interFont.match(
			/src: url\((.+)\) format\('(opentype|truetype)'\)/,
		)?.[1]
		if (!interUrl) throw new Error('Could not find Inter font URL')
		const interData = await fetch(interUrl).then((res) => res.arrayBuffer())

		const dmSerifFont = await fetch(
			'https://fonts.googleapis.com/css2?family=DM+Serif+Text:wght@400&display=swap',
		).then((res) => res.text())
		const dmSerifUrl = dmSerifFont.match(
			/src: url\((.+)\) format\('(opentype|truetype)'\)/,
		)?.[1]
		if (!dmSerifUrl) throw new Error('Could not find DM Serif Text font URL')
		const dmSerifData = await fetch(dmSerifUrl).then((res) => res.arrayBuffer())

		return {
			inter: interData,
			dmSerif: dmSerifData,
		}
	} catch (e) {
		console.error('Failed to load fonts:', e)
		throw e
	}
}

export async function GET(request: Request) {
	try {
		const { searchParams, origin } = new URL(request.url)

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
				console.log('🔍 Looking up product:', resourceSlugOrID)
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
				// Ensure image URLs are absolute
				const coverImageUrl = resource?.fields?.coverImage?.url
				const imageUrl = resource.fields?.image
				const productImageUrl = product?.fields?.image?.url
				const muxImageUrl = muxPlaybackId
					? `https://image.mux.com/${muxPlaybackId}/thumbnail.png?time=${
							resource?.fields.thumbnailTime || 0
						}&width=1200`
					: null

				image = coverImageUrl || imageUrl || productImageUrl || muxImageUrl

				// Make sure the image URL is absolute
				if (image && !image.startsWith('http')) {
					image = `${origin}${image}`
				}
			}
		} else {
			if (hasTitle) {
				title = searchParams.get('title')?.slice(0, 100)
			} else {
				title = 'The Craft of UI'
			}
		}

		const titleLengthLimit = 60

		const titleTruncated =
			title?.length > titleLengthLimit
				? `${title?.slice(0, titleLengthLimit)}...`
				: title

		const fonts = await loadFonts()

		return new ImageResponse(
			(
				<div
					tw="relative flex w-[1200px] h-[630px] text-white"
					style={{
						backgroundColor: '#1F1F22',
						fontFamily: 'Inter',
						overflow: 'hidden',
					}}
				>
					{/* Grid background (inline style, not possible with Tailwind) */}
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '100%',
							zIndex: 0,
							pointerEvents: 'none',
							backgroundImage:
								'linear-gradient(90deg, rgba(255,255,255,0.20) 1px, transparent 1px 128px), ' +
								'linear-gradient(rgba(255,255,255,0.20) 1px, transparent 1px 128px)',
							backgroundSize: '64px 64px',
							backgroundPosition: '17px 0, 0 19px',
							maskImage: 'linear-gradient(-30deg, transparent 50%, white)',
							WebkitMaskImage:
								'linear-gradient(-30deg, transparent 50%, white)',
						}}
					/>

					{/* Favicon in top-left corner */}
					<div tw="absolute left-6 top-6 flex">
						<svg
							width={48}
							height={48}
							viewBox="0 0 512 512"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M84.5613 436.898L59.5937 471.223M54.9146 441.577L89.2403 466.544"
								stroke="white"
								strokeWidth="21.2228"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M469.937 15.5007L438.936 44.4928M439.941 14.4961L468.933 45.4974"
								stroke="white"
								strokeWidth="21.2228"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M82.9431 393.821L70.3031 395.363C70.9828 400.936 75.2318 405.406 80.7628 406.367L82.9431 393.821ZM437.21 89.6969L445.505 99.3587C449.068 96.2995 450.659 91.527 449.642 86.9416C448.626 82.3562 445.168 78.7025 440.646 77.4354L437.21 89.6969ZM449.994 89.5047C449.854 82.4735 444.041 76.887 437.009 77.027C429.978 77.167 424.392 82.9804 424.532 90.0117L449.994 89.5047ZM444.568 456.668L442.388 469.214C446.134 469.865 449.976 468.808 452.861 466.331C455.747 463.854 457.375 460.217 457.299 456.415L444.568 456.668ZM64.4122 241.908L56.1179 232.246C52.8875 235.019 51.2567 239.223 51.7722 243.45L64.4122 241.908ZM293.333 36.1625C286.562 34.2653 279.534 38.2169 277.637 44.9887C275.739 51.7606 279.691 58.7883 286.463 60.6856L293.333 36.1625ZM91.2374 403.483L445.505 99.3587L428.916 80.0351L74.6488 384.16L91.2374 403.483ZM424.532 90.0117L431.837 456.922L457.299 456.415L449.994 89.5047L424.532 90.0117ZM80.7628 406.367L442.388 469.214L446.748 444.123L85.1234 381.276L80.7628 406.367ZM72.7065 251.57L298.149 58.0358L281.561 38.7121L56.1179 232.246L72.7065 251.57ZM95.5831 392.28L77.0522 240.366L51.7722 243.45L70.3031 395.363L95.5831 392.28ZM440.646 77.4354L293.333 36.1625L286.463 60.6856L433.775 101.958L440.646 77.4354Z"
								fill="white"
							/>
							<path
								d="M333.699 164.516L439.806 451.026"
								stroke="white"
								strokeWidth="25.4674"
							/>
							<path
								d="M172.664 302.797L439.801 451.069"
								stroke="white"
								strokeWidth="25.4674"
							/>
							<path
								d="M149.965 176.218C147.587 169.6 140.293 166.163 133.675 168.542C127.057 170.92 123.62 178.214 125.999 184.832L149.965 176.218ZM193.581 297.566L149.965 176.218L125.999 184.832L169.615 306.181L193.581 297.566Z"
								fill="white"
							/>
							<path
								d="M331.336 173.352L222.769 116.846"
								stroke="white"
								strokeWidth="25.4674"
								strokeLinecap="round"
							/>
						</svg>
					</div>

					{resource && resource.type === 'post' && image && (
						<img
							src={image}
							alt={title || ''}
							width={1200}
							height={630}
							style={{
								position: 'absolute',
								width: '100%',
								height: '100%',
								objectFit: 'contain',
							}}
						/>
					)}
					{resource && resource.type === 'post' && image && (
						<div
							style={{
								position: 'absolute',
								width: '100%',
								height: '100%',
								backgroundColor: 'rgba(255, 255, 255, 0.8)',
							}}
						/>
					)}
					{resource && resource.type === 'post' && image && (
						<div
							style={{
								position: 'absolute',
								right: 160,
								top: 104,
								zIndex: 10,
								display: 'flex',
							}}
						>
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

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							position: 'absolute',
							right: 96,
							bottom: 96,
							justifyContent: 'center',
							fontSize: '32px',
							fontWeight: 'bold',
							fontFamily: 'DM Serif Text',
							color: '#ef4444',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'flex-end',
								gap: '6px',
								fontWeight: 'bold',
							}}
						>
							<span style={{ paddingLeft: '12px' }}>The Craft of UI</span>
						</div>
					</div>
					<main
						style={{
							display: 'flex',
							padding: '104px',
							paddingTop: '112px',
							position: 'relative',
							zIndex: 10,
							flexDirection: 'row',
							width: '100%',
							height: '100%',
							flexGrow: 1,
							alignItems: 'flex-start',
							justifyContent: 'space-between',
						}}
					>
						<div
							style={{
								fontSize: '64px',
								minWidth: '500px',
								lineHeight: 1.2,
								paddingRight: '96px',
								display: 'flex',
								fontFamily: 'DM Serif Text',
							}}
						>
							<span>{titleTruncated}</span>
						</div>
						{image && resource && resource?.type !== 'post' && (
							<div
								style={{
									display: 'flex',
									alignItems: 'flex-start',
									marginRight: '-128px',
									justifyContent: 'flex-start',
									height: '100%',
								}}
							>
								<div
									style={{
										position: 'relative',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<img
										src={image}
										alt={title || ''}
										width={700}
										height={394}
										style={{
											objectFit: 'cover',
										}}
									/>
									<div
										style={{
											position: 'absolute',
											zIndex: 10,
											display: 'flex',
										}}
									>
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
						name: 'Inter',
						data: fonts.inter,
						style: 'normal',
					},
					{
						name: 'DM Serif Text',
						data: fonts.dmSerif,
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
