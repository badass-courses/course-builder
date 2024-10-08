// EXAMPLE USAGE
// with resource: /api/og?resource=[SLUG_OR_ID]
// with custom title: /api/og?title=ANYTHING

import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource, products } from '@/db/schema'
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
			new URL('../../../../public/fonts/Heading-Medium.ttf', import.meta.url),
		).then((res) => res.arrayBuffer())

		const seed = resourceSlugOrID || title || 'default-seed'

		// const hexGridPattern = generateHexGridSVG(seed)
		const squareGridPattern = generateSquareGridSVG(seed)

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

const SCALE = 1.75

function generateSquareGridSVG(seed: string, width = 1200, height = 800) {
	const rand = mulberry32(hashCode(seed))

	const squareSize = 50 * SCALE // Adjust as needed

	const cols = Math.ceil(width / squareSize)
	const rows = Math.ceil(height / squareSize)

	let svgElements = ''

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const x = col * squareSize
			const y = row * squareSize

			// Generate square outline
			const squarePath = generateSquarePath(x, y, squareSize)
			svgElements += `<path d="${squarePath}" stroke="#524C46" stroke-width="2" fill="none" />`

			const shapes: string[] = [
				'M6 6h14v11h-6.8v-5.2h2V15H18V8H8v15h32V8H30v7h2.8v-3.2h2V17H28V6h14v36H28V31h6.8v5.2h-2V33H30v7h10V25H8v15h10v-7h-2.8v3.2h-2V31H20v11H6V6Z',
				'M7 8h33v32H15.087V16.667h16.826v14.666h-9.087V24h2v5.333h5.087V18.667H17.087V38H38V10H9v38H7V8Z',
				'M48 6H0V4h48v2ZM11.867 23.833v-2H16V18H6.389v14H0v-2h4.39V16H18v7.833h-6.133ZM30 27.5h2V30h8.389V16H48v2h-5.611v14H30v-4.5Zm-18 0V32h12.389V18H34v3.833h-4.133v2H36V16H22.389v14H14v-2.5h-2ZM48 39H0v-2h48v2ZM0 44h48v-2H0v2Zm0-33h48V9H0v2Z',
				'M48 2H0V0h48v2ZM6 48V8H0V6h48v2h-6v40h-2V8h-3.667v40h-2V8h-3.667v40h-2V8H25v40h-2V8h-3.667v40h-2V8h-3.667v40h-2V8H8v40H6Z',
				'M46 2H2v44h44V2ZM0 0v48h48V0H0Zm39 9h-4v30h4V9Zm-6 30v-4h-3v4h3Zm-5 0v-4h-3v4h3Zm-5 0h-3v-4h3v4Zm-8 0h3v-4h-3v4Zm-2 0H9V9h4v30Zm2-6h18V15H15v18Zm3-20h-3V9h3v4Zm2-4v4h3V9h-3Zm8 4h-3V9h3v4Zm2-4v4h3V9h-3ZM7 7v34h34V7H7Zm21 13h-8v8h8v-8Zm-10-2v12h12V18H18Zm4 8v-4h4v4h-4Z',
				'M40 40H7V8h24.913v23.333H15.087V16.667h9.087V24h-2v-5.333h-5.087v10.666h12.826V10H9v28h29V0h2v40Z',
				'M15 0v44h2V0h-2Zm-3 44H4v-8.5h8v4h-2v-2H6V42h6v2Zm24 0h8v-8.5h-8v4h2v-2h4V42h-6v2Zm-17 0V0h2v44h-2Zm4-44v44h2V0h-2Zm4 44V0h2v44h-2Zm4-44v44h2V0h-2ZM4 46h40v2H4v-2Z',
				'm43.303 24-5.916-2.784C35.347 20.256 33 21.745 33 24s2.346 3.744 4.387 2.784L43.303 24Zm-5.064-4.594a5.016 5.016 0 0 0-3.665-.258l2.86-8.583-8.582 2.861a5.016 5.016 0 0 0-.258-3.665L24 0l-4.594 9.761a5.016 5.016 0 0 0-.258 3.665l-8.583-2.86 2.861 8.582a5.016 5.016 0 0 0-3.665.258L0 24l9.761 4.594a5.016 5.016 0 0 0 3.665.258l-2.86 8.583 8.582-2.86a5.016 5.016 0 0 0 .258 3.664L24 48l4.594-9.761a5.016 5.016 0 0 0 .258-3.665l8.583 2.861-2.861-8.583c1.148.36 2.44.318 3.665-.258L48 24l-9.761-4.594Zm-3.966 14.867-2.253-6.759c-.838-2.512-4.026-3.265-5.899-1.392-1.872 1.872-1.12 5.06 1.393 5.898l6.759 2.253ZM22.433 24A5.686 5.686 0 0 1 24 25.566 5.686 5.686 0 0 1 25.567 24 5.686 5.686 0 0 1 24 22.434 5.686 5.686 0 0 1 22.434 24Zm5.08-8.02 6.76-2.253-2.254 6.76c-.837 2.512-4.025 3.264-5.898 1.392-1.872-1.873-1.12-5.061 1.393-5.899ZM15.98 27.514l-2.253 6.759 6.76-2.253c2.512-.837 3.264-4.026 1.392-5.898-1.873-1.873-5.061-1.12-5.899 1.392Zm4.506-11.534-6.759-2.253 2.253 6.76c.838 2.512 4.026 3.264 5.899 1.392 1.872-1.873 1.12-5.061-1.393-5.899Zm-9.873 10.804L4.697 24l5.916-2.784C12.653 20.256 15 21.745 15 24s-2.346 3.744-4.387 2.784ZM24 43.303l2.784-5.916C27.744 35.347 26.255 33 24 33s-3.744 2.346-2.784 4.387L24 43.303Zm-2.784-32.69L24 4.697l2.784 5.916C27.744 12.653 26.255 15 24 15s-3.744-2.346-2.784-4.387Z',
				'M44 7H29v30h2V9h13v9h-8v-4h2v2h4v-5h-9v10h11v2H33v16h-6V7H4V5h40v2ZM4 9h8v2H6v5h4v-2.5h2V18H4V9Zm40 30h-8v-2h6v-5h-4v2h-2v-4h8v9Zm-29 0H4v-9h8v4h-2v-2H6v5h9V27H4v-2h11V9h6v32h23v2H4v-2h15V11h-2v28h-2Zm8-30v30h2V9h-2ZM12 23H4v-2h8v2Zm24 4h8v-2h-8v2Z',
				'M22 14h-8v8h8v-8Zm-6 6v-4h4v4h-4Zm6 6h-8v8h8v-8Zm-6 6v-4h4v4h-4Zm10-18h8v8h-8v-8Zm2 2v4h4v-4h-4Zm6 10h-8v8h8v-8Zm-6 6v-4h4v4h-4Z',
				'M44 4H5v40h39V33H16V15h28V4ZM7 42V6h35v7H14v22h28v7H7ZM41 7H8v34h33v-5H13V12h28V7ZM10 39V9h29v1H11v28h28v1H10Z',
				'M1 3h46v9.81L40.366 11H28v29h7v5H12.5v-5H20V11H7.147L1 12.844V3Zm2 2v5.156L6.853 9H22v33h-7.5v1H33v-1h-7V9h14.634L45 10.19V5H3Zm20 1H4v2h19v34h2V8h19V6H23Z',
				'', // empty squares look good
				'',
			]

			const randomShape: any = shapes[Math.floor(rand() * shapes.length)]
			const index = x + y

			// Generate the shape and add it to the SVG elements
			svgElements += generateUserShapeTemplate(
				randomShape,
				x,
				y,
				squareSize,
				rand,
				index,
			)
		}
	}

	const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ripple">
          <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="50" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="#040404" />
      ${svgElements}
    </svg>
  `
	return `data:image/svg+xml;base64,${btoa(svgContent)}`
}

function generateSquarePath(x: number, y: number, size: number) {
	const pathData = `M${x},${y} h${size} v${size} h-${size} Z`
	return pathData
}

function generateUserShapeTemplate(
	d: string,
	x: number,
	y: number,
	size: number,
	rand: () => number,
	index: number,
) {
	// Generate the clipping path for the square
	const clipPath = generateSquarePath(0, 0, size)

	// Define available colors and rotations
	const availableColors = ['#524C46', '#7B6B5B', '#E2C4A1', '#7B6B5B']
	// const availableColors = ['#1B1B1B', '#1B1B1B', '#373028']
	const color = availableColors[Math.floor(rand() * availableColors.length)]
	const availableRotations = [
		'rotate(0)',
		// 'rotate(90)',
		// 'rotate(180)',
		// 'rotate(270)',
	]
	const rotation =
		availableRotations[Math.floor(rand() * availableRotations.length)]

	// Transform to position the shape within the square
	const transform = transformCustomShapeFromFigma(size)

	return `
    <g clip-path="url(#clip-${index})" filter="url(#ripple)" transform="translate(${x}, ${y}) ${rotation}">
      <path fill="${color}" transform="${transform}" fill-rule="evenodd" d="${d}" clip-rule="evenodd"/>
    </g>
    <defs>
      <clipPath id="clip-${index}">
        <path d="${clipPath}" />
      </clipPath>
    </defs>
  `
}

function transformCustomShapeFromFigma(size: number) {
	const originalSize = 50 * SCALE // Original size from Figma
	const scale = 1.8

	// Adjust the translation to center the shape within the square
	const translateX = 0 // size - originalSize * scale
	const translateY = 0 // size - originalSize * scale

	return `translate(${translateX}, ${translateY}) scale(${scale})`
}

function hashCode(str: string) {
	let hash = 0
	if (str.length === 0) return hash
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash &= hash // Convert to 32-bit integer
	}
	return hash
}

function base64Encode(str: string) {
	return Buffer.from(str, 'binary').toString('base64')
}

function mulberry32(a: number) {
	return function () {
		var t = (a += 0x6d2b79f5)
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}
