// EXAMPLE USAGE
// with resource: /api/og?resource=[SLUG_OR_ID]
// with custom title: /api/og?title=ANYTHING

import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource, contentResourceResource, products } from '@/db/schema'
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
				title = 'Learn Professional Programming'
			}
		}

		const seed = resourceSlugOrID || title || 'default-seed'

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full bg-white flex-col"
					style={{
						fontFamily: 'Inter',
						background: '#FFFFFF',
						color: '#222329',
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
					{resource && image && muxPlaybackId && (
						<div tw="absolute right-20 top-20 z-10 flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={32}
								height={32}
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polygon points="5 3 19 12 5 21 5 3"></polygon>
							</svg>
						</div>
					)}
					<div tw="flex items-center absolute left-16 top-16 justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={180}
							height={60}
							viewBox="0 0 80 26"
							fill="none"
						>
							<path
								d="M10.7749 13.7201C10.5849 13.1001 10.3749 12.5201 10.1449 11.9801C9.92494 11.4301 9.69494 10.9501 9.45494 10.5401C9.22494 10.1201 8.99494 9.78006 8.76494 9.52006C8.53494 9.26006 8.32494 9.10006 8.13494 9.04006V8.94006C8.69494 8.72006 9.13494 8.36006 9.45494 7.86006C9.78494 7.36006 9.94994 6.73006 9.94994 5.97006C9.94994 5.51006 9.86494 5.09006 9.69494 4.71006C9.52494 4.33006 9.27494 4.00006 8.94494 3.72006C8.61494 3.44006 8.20494 3.22006 7.71494 3.06006C7.23494 2.90006 6.67494 2.82006 6.03494 2.82006H1.57494V13.0001H3.87494V9.94006H5.50494C5.73494 9.94006 5.93994 9.99006 6.11994 10.0901C6.30994 10.1801 6.47994 10.3201 6.62994 10.5101C6.78994 10.7001 6.94494 10.9401 7.09494 11.2301C7.24494 11.5101 7.40494 11.8401 7.57494 12.2201C7.75494 12.5901 7.94994 13.0001 8.15994 13.4501C8.36994 13.8901 8.60994 14.3701 8.87994 14.8901C8.99994 15.1301 9.15494 15.3001 9.34494 15.4001C9.53494 15.5001 9.76494 15.5501 10.0349 15.5501H12.1349L10.7749 13.7201ZM6.11994 7.86006H3.87494V4.96006H6.01494C6.29494 4.96006 6.54494 4.99006 6.76494 5.05006C6.98494 5.10006 7.16994 5.19006 7.31994 5.32006C7.46994 5.44006 7.58494 5.60006 7.66494 5.80006C7.74494 5.99006 7.78494 6.22006 7.78494 6.49006C7.78494 6.74006 7.74494 6.96006 7.66494 7.15006C7.58494 7.33006 7.46994 7.48006 7.31994 7.60006C7.17994 7.72006 7.00494 7.81006 6.79494 7.87006C6.59494 7.92006 6.36994 7.94506 6.11994 7.94506V7.86006Z"
								fill="#252526"
							/>
							<path
								d="M20.8449 12.8201C20.6749 12.5501 20.4549 12.3201 20.1849 12.1301C19.9249 11.9401 19.6249 11.7901 19.2849 11.6801C18.9549 11.5701 18.5949 11.5151 18.2049 11.5151H16.5549V8.07006H20.6949V5.99006H14.2549V13.5951H18.2649C18.4549 13.5951 18.6249 13.6251 18.7749 13.6851C18.9249 13.7351 19.0549 13.8101 19.1649 13.9101C19.2749 14.0001 19.3549 14.1101 19.4049 14.2401C19.4649 14.3701 19.4949 14.5101 19.4949 14.6601C19.4949 14.9601 19.3849 15.1901 19.1649 15.3501C18.9549 15.5001 18.6649 15.5751 18.2949 15.5751H14.2549V17.6551H18.2949C18.6849 17.6551 19.0549 17.6001 19.4049 17.4901C19.7549 17.3701 20.0649 17.2001 20.3349 16.9801C20.6049 16.7501 20.8149 16.4701 20.9649 16.1401C21.1249 15.8001 21.2049 15.4101 21.2049 14.9701C21.2049 14.5101 21.1249 14.1001 20.9649 13.7401L20.8449 12.8201Z"
								fill="#252526"
							/>
							<path
								d="M29.5649 12.8201C29.3949 12.5501 29.1749 12.3201 28.9049 12.1301C28.6449 11.9401 28.3449 11.7901 28.0049 11.6801C27.6749 11.5701 27.3149 11.5151 26.9249 11.5151H25.2749V8.07006H29.4149V5.99006H22.9749V13.5951H26.9849C27.1749 13.5951 27.3449 13.6251 27.4949 13.6851C27.6449 13.7351 27.7749 13.8101 27.8849 13.9101C27.9949 14.0001 28.0749 14.1101 28.1249 14.2401C28.1849 14.3701 28.2149 14.5101 28.2149 14.6601C28.2149 14.9601 28.1049 15.1901 27.8849 15.3501C27.6749 15.5001 27.3849 15.5751 27.0149 15.5751H22.9749V17.6551H27.0149C27.4049 17.6551 27.7749 17.6001 28.1249 17.4901C28.4749 17.3701 28.7849 17.2001 29.0549 16.9801C29.3249 16.7501 29.5349 16.4701 29.6849 16.1401C29.8449 15.8001 29.9249 15.4101 29.9249 14.9701C29.9249 14.5101 29.8449 14.1001 29.6849 13.7401L29.5649 12.8201Z"
								fill="#252526"
							/>
							<path
								d="M37.2849 2.82007H35.0049V8.89007H32.0049V2.82007H29.7249V17.6551H32.0049V10.9701H35.0049V17.6551H37.2849V2.82007Z"
								fill="#252526"
							/>
							<path
								d="M45.3549 12.9901H40.4049V10.9101H44.7749V8.83007H40.4049V6.90007H45.2149V4.82007H38.1249V17.6551H45.3549V15.5751V12.9901Z"
								fill="#252526"
							/>
							<path
								d="M52.4949 4.82007H50.1149L46.0949 17.6551H48.5649L49.2549 15.3951H53.3649L54.0549 17.6551H56.5249L52.4949 4.82007ZM49.9449 13.1651L51.3149 8.64007L52.6849 13.1651H49.9449Z"
								fill="#252526"
							/>
							<path
								d="M57.5049 4.82007V17.6551H61.5149C62.1949 17.6551 62.8249 17.5551 63.4049 17.3551C63.9949 17.1451 64.5049 16.8501 64.9349 16.4701C65.3749 16.0801 65.7149 15.6101 65.9549 15.0601C66.2049 14.5001 66.3299 13.8651 66.3299 13.1551V9.32007C66.3299 8.61007 66.2049 8.28506 65.9549 7.72506C65.7149 7.16506 65.3749 6.69007 64.9349 6.30007C64.5049 5.91007 63.9949 5.61007 63.4049 5.40007C62.8249 5.19007 62.1949 5.08507 61.5149 5.08507H57.5049V4.82007ZM61.5149 15.3101H59.7849V7.16507H61.5149C61.8549 7.16507 62.1649 7.22007 62.4449 7.33007C62.7349 7.43007 62.9849 7.58007 63.1949 7.78007C63.4049 7.97007 63.5649 8.20507 63.6749 8.48507C63.7949 8.76507 63.8549 9.08007 63.8549 9.43007V12.9451C63.8549 13.2951 63.7949 13.6101 63.6749 13.8901C63.5649 14.1601 63.4049 14.3901 63.1949 14.5801C62.9849 14.7701 62.7349 14.9151 62.4449 15.0151C62.1649 15.1151 61.8549 15.1651 61.5149 15.1651V15.3101Z"
								fill="#252526"
							/>
							<path
								d="M71.0149 15.3101C71.0149 15.6001 71.0999 15.8401 71.2699 16.0301C71.4499 16.2201 71.6949 16.3151 72.0049 16.3151C72.3149 16.3151 72.5549 16.2201 72.7249 16.0301C72.9049 15.8401 72.9949 15.6001 72.9949 15.3101C72.9949 15.0101 72.9049 14.7651 72.7249 14.5751C72.5549 14.3751 72.3149 14.2751 72.0049 14.2751C71.6949 14.2751 71.4499 14.3751 71.2699 14.5751C71.0999 14.7651 71.0149 15.0101 71.0149 15.3101Z"
								fill="#252526"
							/>
							<path
								d="M78.1349 4.82007H75.8549V17.6551H78.1349V4.82007Z"
								fill="#252526"
							/>
						</svg>
					</div>
					<main tw="flex p-20 pb-24 relative z-10 flex-row w-full h-full flex-grow items-end justify-between">
						<div
							tw={`${resource?.type === 'post' ? 'text-[72px]' : 'text-[64px]'} text-[#222329] leading-tight pr-16 max-w-[900px]`}
						>
							{title}
						</div>
					</main>
				</div>
			),
			{
				debug: false,
			},
		)
	} catch (e: any) {
		return new Response('Failed to generate OG image', { status: 500 })
	}
}
