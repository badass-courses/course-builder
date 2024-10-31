// EXAMPLE USAGE
// with resource: /api/og?resource=[SLUG_OR_ID]
// with custom title: /api/og?title=ANYTHING

import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource, products } from '@/db/schema'
import { generateGridPattern } from '@/utils/generate-grid-pattern'
import { and, eq, or, sql } from 'drizzle-orm'

export const runtime = 'edge'
export const revalidate = 60
// export const contentType = 'image/png'

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const resourceTypesWithImages = ['workshop', 'tutorial', 'self-paced']
		const hasResource = searchParams.has('resource')
		const resourceSlugOrID = hasResource ? searchParams.get('resource') : null
		const hasTitle = searchParams.has('title')
		let title
		let image
		if (resourceSlugOrID && !hasTitle) {
			let resource = await db.query.contentResource.findFirst({
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
					}}
				>
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
					<div tw="flex items-center justify-center absolute left-26 top-26">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={181 * 1.7}
							height={50 * 1.7}
							fill="none"
							viewBox="0 0 181 50"
						>
							<path
								fill="#E2C4A1"
								fillRule="evenodd"
								d="M10.768 17.24a2.796 2.796 0 0 0-.202 1.043v2.24a1.4 1.4 0 0 0 1.4-1.4v-.84c0-.062.005-.123.012-.183.03-.23.003-.455-.071-.66.214-.037.422-.126.607-.267a1.44 1.44 0 0 1 .152-.102l.727-.42a1.4 1.4 0 0 0 .513-1.912l-1.94 1.12a2.812 2.812 0 0 0-1.198 1.382Zm5.076-3.62a1.4 1.4 0 0 0 1.912.512l1.454-.84a1.4 1.4 0 0 0 .513-1.912l-3.88 2.24Zm5.817-3.358a1.4 1.4 0 0 0 1.912.512l.727-.42c.054-.03.109-.058.165-.081.214-.089.395-.225.535-.392.14.167.32.303.536.392.056.023.11.05.164.081l.727.42a1.4 1.4 0 0 0 1.913-.512l-1.94-1.12a2.805 2.805 0 0 0-2.471-.162 2.71 2.71 0 0 0-.329.162l-1.94 1.12Zm8.616 1.118a1.4 1.4 0 0 0 .513 1.913l1.454.84a1.4 1.4 0 0 0 1.913-.513l-3.88-2.24Zm5.817 3.359a1.4 1.4 0 0 0 .513 1.912l.727.42a1.3 1.3 0 0 1 .152.102c.185.141.393.23.608.268a1.389 1.389 0 0 0-.072.66c.008.06.012.12.012.182v.84a1.4 1.4 0 0 0 1.4 1.4v-2.24a2.805 2.805 0 0 0-1.4-2.425l-1.94-1.12Zm3.34 8.021a1.4 1.4 0 0 0-1.4 1.4v1.68a1.4 1.4 0 0 0 1.4 1.4v-4.48Zm0 6.717a1.4 1.4 0 0 0-1.4 1.4v.84c0 .062-.004.123-.012.183-.03.23-.003.455.072.66a1.393 1.393 0 0 0-.608.267 1.41 1.41 0 0 1-.152.102l-.727.42a1.4 1.4 0 0 0-.513 1.913l1.94-1.12a2.802 2.802 0 0 0 1.4-2.425v-2.24Zm-5.277 6.903a1.4 1.4 0 0 0-1.913-.512l-1.454.84a1.4 1.4 0 0 0-.512 1.912l3.879-2.24Zm-5.817 3.36a1.4 1.4 0 0 0-1.913-.513l-.727.42a1.4 1.4 0 0 1-.164.081 1.393 1.393 0 0 0-.536.392 1.394 1.394 0 0 0-.535-.392 1.385 1.385 0 0 1-.165-.081l-.727-.42a1.4 1.4 0 0 0-1.912.513l1.94 1.12a2.8 2.8 0 0 0 2.8 0l1.939-1.12Zm-8.617-1.12a1.4 1.4 0 0 0-.513-1.911l-1.454-.84a1.4 1.4 0 0 0-1.912.512l3.879 2.24Zm-5.817-3.358a1.4 1.4 0 0 0-.513-1.912l-.727-.42a1.398 1.398 0 0 1-.152-.102 1.392 1.392 0 0 0-.607-.267c.074-.205.102-.43.071-.66a1.401 1.401 0 0 1-.012-.183v-.84a1.4 1.4 0 0 0-1.4-1.4v2.24a2.803 2.803 0 0 0 1.4 2.425l1.94 1.12Zm-3.34-8.021a1.4 1.4 0 0 0 1.4-1.4v-1.68a1.4 1.4 0 0 0-1.4-1.4v4.48Z"
								clipRule="evenodd"
								opacity=".3"
							/>
							<path
								fill="#E2C4A1"
								fillRule="evenodd"
								d="m50 25-1.52-1.52C47.73 11.697 38.305 2.27 26.52 1.52L25 0l-1.519 1.519C11.696 2.269 2.27 11.696 1.518 23.482L0 25l1.518 1.518c.751 11.786 10.178 21.213 21.963 21.963L25 50l1.519-1.519c11.785-.75 21.21-10.177 21.962-21.962L50 25Zm-3.084-3.084c-1.36-9.754-9.078-17.472-18.832-18.832l18.832 18.832ZM25 2.87c-.305 0-.608.006-.91.018L2.89 24.091a22.52 22.52 0 0 0 0 1.818l21.2 21.201a22.456 22.456 0 0 0 1.818 0l21.202-21.2a22.495 22.495 0 0 0 0-1.818L25.909 2.889a22.528 22.528 0 0 0-.91-.018Zm-3.084.213c-9.754 1.36-17.473 9.078-18.833 18.833L21.916 3.084Zm-18.833 25c1.36 9.754 9.079 17.473 18.834 18.832L3.082 28.084Zm25 18.832c9.755-1.36 17.473-9.078 18.833-18.832L28.084 46.916Zm-7.456-24.441L25 19.95l4.374 2.525v5.05L25 30.05l-4.373-2.525v-5.05ZM25 18.333l5.774 3.333v6.667L25 31.666l-5.773-3.333v-6.667L25 18.333Zm155.724 9.97-.42-.14c-.308.84-1.288 2.773-3.892 2.773-2.548 0-4.088-1.82-4.2-5.264l8.26-.14c.084-.532.112-.98.112-1.54 0-2.856-1.484-4.9-4.844-4.9-3.444 0-5.656 2.24-5.656 6.496 0 4.228 2.1 6.608 5.768 6.608 3.528 0 4.62-2.828 4.872-3.892Zm-8.512-3.36c.112-3.555 1.736-4.787 3.528-4.787 1.82 0 2.716 1.512 2.716 3.108 0 .476-.056.896-.14 1.26l-6.104.42Zm-5.393 4.985c0 1.26.644 1.512 1.484 1.512V32h-3.612v-3.052c-.42 1.568-1.652 3.248-4.06 3.248-2.604 0-4.816-1.4-4.816-6.552 0-5.152 2.212-6.552 4.816-6.552 2.408 0 3.696 1.512 4.06 3.024v-5.88c0-1.26-.672-1.512-1.512-1.512v-.56h3.64v15.764Zm-5.656 1.204c1.568 0 3.276-1.204 3.528-4.648v-1.68c-.252-3.444-1.96-4.648-3.528-4.648-2.184 0-3.052 1.96-3.052 5.488 0 3.556.812 5.488 3.052 5.488Zm-7.352-5.488c0-3.78-2.044-6.552-5.768-6.552-3.724 0-5.74 2.772-5.74 6.552s2.016 6.552 5.74 6.552 5.768-2.772 5.768-6.552Zm-2.296 0c0 3.08-.98 5.488-3.472 5.488s-3.472-2.408-3.472-5.488c0-3.08.98-5.488 3.472-5.488s3.472 2.408 3.472 5.488Zm-10.396-10.892c-1.008 0-1.792.28-1.792 1.596v13.468c0 1.316.784 1.596 1.792 1.596V32h-4.732l-8.988-15.96v13.776c0 1.316.98 1.596 2.268 1.596V32h-5.6v-.588c.98 0 1.792-.28 1.792-1.596V16.348c0-1.316-.812-1.596-1.792-1.596v-.588h4.648l9.072 16.044v-13.86c0-1.316-1.092-1.596-2.464-1.596v-.588h5.796v.588ZM116.118 31.44c-.84 0-1.484-.252-1.484-1.512V14.164h-3.612v.56c.84 0 1.512.252 1.512 1.512v13.692c0 1.26-.672 1.512-1.512 1.512V32h5.096v-.56Zm-7.681-1.512c0 1.26.644 1.512 1.484 1.512V32h-3.388v-3.78h-.112c-.42 1.848-1.428 3.976-4.116 3.976-2.128 0-3.556-1.26-3.556-4.368 0-.644.084-1.484.308-2.268l7.392-.728v-.588c0-2.296-.644-4.088-2.884-4.088-1.764 0-2.548 1.064-2.548 2.212 0 .448.14.84.336 1.064v.084l-2.1.224a2.925 2.925 0 0 1-.224-1.12c0-1.82 1.484-3.528 4.676-3.528 4.508 0 4.732 3.444 4.732 6.02v4.816Zm-5.488.952c2.156 0 3.22-2.436 3.444-5.432l-5.348.952a6.147 6.147 0 0 0-.196 1.624c0 1.792.616 2.856 2.1 2.856Zm-10.35-10.276h4.311v-1.26h-2.323l-1.989.448v-4.368h-.644c-.223 2.576-1.175 3.92-3.415 4.312v.868h1.931v7.84c0 2.38 1.093 3.752 3.276 3.752 2.857 0 3.08-2.492 3.08-3.164h-.391c-.056.476-.392 1.764-1.877 1.764-1.232 0-1.96-.728-1.96-2.352v-7.84ZM81.57 19.092c3.724 0 5.768 2.772 5.768 6.552s-2.044 6.552-5.768 6.552c-3.724 0-5.74-2.772-5.74-6.552s2.016-6.552 5.74-6.552Zm0 12.04c2.492 0 3.472-2.408 3.472-5.488 0-3.08-.98-5.488-3.472-5.488s-3.472 2.408-3.472 5.488c0 3.08.98 5.488 3.472 5.488Zm-4.618-13.076L77.54 18l-.392-4.116c-.504.224-1.12.28-2.044.28H64.576c-.924 0-1.54-.056-2.044-.28l-.112 1.176-.336 2.94.588.056c.168-1.428.56-2.604 1.876-2.604h4.172v14.364c0 1.316-.868 1.596-1.988 1.596V32h6.188v-.588c-1.12 0-1.96-.28-1.96-1.596V15.452h4.144c1.316 0 1.708 1.204 1.848 2.604Z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<main tw="flex p-26 pb-32 relative z-10 flex-row w-full h-full flex-grow items-end justify-between">
						<div tw="text-[62px] text-[#EAEAEA] leading-tight pr-24">
							{title}
						</div>
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
						name: 'HeadingFont',
						data: fontData,
						style: 'normal',
					},
				],
			},
		)
	} catch (e: any) {
		return new Response('Failed to generate OG image', { status: 500 })
	}
}
