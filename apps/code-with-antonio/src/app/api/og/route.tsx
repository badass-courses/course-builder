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
				title = 'Code with Antonio'
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
					<div tw="flex items-center justify-center absolute left-26 top-26">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={211 * 1.1}
							height={58 * 1.1}
							fill="none"
							viewBox="0 0 211 58"
						>
							<g clipPath="url(#a)">
								<path
									fill="#fff"
									fillRule="evenodd"
									d="m58.966-.978.228-.206-3.849-3.464-23.86 21.477V-.414h-5.178V16.27L3.068-4.648-.769-1.195l-.001-.001-3.465 3.849 20.919 23.239H.024v5.178h17.219L-4.235 54.93l3.465 3.849L26.223 28.79-.666-1.08l29.873 26.89L56.899.881l-25.122 27.91L58.77 58.778l3.465-3.85L40.758 31.07h17.218v-5.178h-16.66l20.919-23.24-3.269-3.63Zm.228 60.16L29.207 32.19-.781 59.183l3.85 3.464L26.306 41.73V58h5.178V41.17l23.86 21.477 3.85-3.464Z"
									clipRule="evenodd"
								/>
							</g>
							<path
								fill="#fff"
								d="m95.071 41-1.506-4.397H82.898L81.392 41h-5.985l10.097-28.499h5.455L101.097 41h-6.026ZM84.69 31.23h7.085l-3.502-10.342h-.081L84.689 31.23Zm39.629-13.192h-6.554v17.425h6.554V41h-19.175v-5.537h6.595V18.038h-6.595v-5.537h19.175v5.537Z"
							/>
							<path
								fill="#CACACA"
								d="M130.197 41V11.28h4.885v10.056h.082c1.262-1.588 3.42-2.524 5.74-2.524 4.845 0 8.061 3.297 8.061 8.06V41h-4.885V27.931c0-2.89-1.629-4.56-4.438-4.56-2.809 0-4.56 1.792-4.56 4.56V41h-4.885Zm22.245-10.789c0-6.717 4.194-11.4 10.056-11.4 5.985 0 9.975 4.56 9.975 11.156v1.67h-15.104c.162 3.46 2.157 5.74 5.211 5.74 2.402 0 4.03-1.059 5.659-3.542l3.582 2.605c-1.954 3.42-5.129 5.17-9.241 5.17-5.985 0-10.138-4.6-10.138-11.399Zm4.967-2.157h10.219c-.163-3.054-2.036-5.008-5.089-5.008-2.809 0-4.967 2.117-5.13 5.008ZM176.117 41V19.422h4.601v1.873h.081c.937-1.425 2.565-2.28 4.56-2.28.977 0 1.832.122 2.606.367l-.855 4.763c-.896-.244-1.669-.366-2.321-.366-2.524 0-3.786 1.71-3.786 5.13V41h-4.886Zm12.465-10.789c0-6.799 4.275-11.4 10.463-11.4 6.229 0 10.504 4.601 10.504 11.4 0 6.8-4.275 11.4-10.504 11.4-6.188 0-10.463-4.6-10.463-11.4Zm16.082 0c0-4.274-2.077-6.92-5.619-6.92-3.46 0-5.577 2.564-5.577 6.92 0 4.357 2.117 6.921 5.577 6.921 3.542 0 5.619-2.646 5.619-6.92Z"
							/>
							<defs>
								<clipPath id="a">
									<path fill="#fff" d="M0 0h58v58H0z" />
								</clipPath>
							</defs>
						</svg>
					</div>
					<main tw="flex p-26 pb-32 relative z-10 flex-row w-full h-full grow items-end justify-between">
						<div
							tw={`${resource?.type === 'post' ? 'text-[62px]' : resource?.type === 'workshop' ? 'text-[42px]' : 'text-[56px]'} min-w-[500px] text-[#EAEAEA] leading-tight pr-16`}
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
