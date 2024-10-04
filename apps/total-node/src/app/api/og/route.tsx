// EXAMPLE USAGE
// with resource: https://pronextjs.dev/api/og?resource=[SLUG_OR_ID]
// with custom title: https://pronextjs.dev/api/og?title=ANYTHING

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
			new URL(
				'../../../../public/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full bg-white flex-col"
					style={{
						fontFamily: 'Maison',
						background: '#040404',
						width: 1200,
						height: 630,
					}}
				>
					<div tw="flex items-center justify-center absolute left-26 top-26">
						<svg
							width="106"
							height="106"
							viewBox="0 0 106 106"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path d="M53 0L106 53L53 106L0 53L53 0Z" fill="#1D1511" />
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M53 0L106 53L53 106L0 53L53 0ZM4.99689 53L53 101.003L101.003 53L53 4.99689L4.99689 53Z"
								fill="#E2C4A1"
							/>
							<path
								opacity="0.6"
								d="M49.4667 19.7065C51.6531 18.4442 54.3469 18.4442 56.5334 19.7065L80.0663 33.2932C82.2527 34.5556 83.5996 36.8885 83.5996 39.4132V66.5866C83.5996 69.1113 82.2527 71.4442 80.0663 72.7065L56.5333 86.2933C54.3469 87.5556 51.6531 87.5556 49.4667 86.2933L25.9338 72.7065C23.7473 71.4442 22.4005 69.1113 22.4005 66.5866V39.4132C22.4005 36.8885 23.7474 34.5556 25.9338 33.2932L49.4667 19.7065Z"
								fill="#1D1511"
							/>
							<path
								opacity="0.6"
								fillRule="evenodd"
								clipRule="evenodd"
								d="M22.9086 36.7816C22.6901 37.3259 22.5385 37.8997 22.4608 38.4907C22.4209 38.7942 22.4005 39.1022 22.4005 39.4132V44.6448C24.3519 44.6448 25.9338 43.0629 25.9338 41.1115V39.4132C25.9338 39.2571 25.944 39.1029 25.964 38.9514C26.0405 38.3696 25.9708 37.8022 25.7833 37.2863C26.3238 37.1907 26.85 36.9674 27.3157 36.6102C27.4369 36.5172 27.5653 36.4312 27.7005 36.3532L29.1713 35.504C30.8612 34.5283 31.4402 32.3674 30.4645 30.6774L25.9338 33.2932C25.6645 33.4487 25.408 33.6204 25.1651 33.8067C24.6921 34.1695 24.2711 34.5877 23.9089 35.0491C23.8663 35.1033 23.8246 35.1581 23.7837 35.2135C23.4677 35.6412 23.2008 36.1035 22.9884 36.591C22.9609 36.6541 22.9343 36.7176 22.9086 36.7816ZM33.1695 29.1157C34.1452 30.8057 36.3061 31.3847 37.9961 30.409L40.9377 28.7107C42.6277 27.735 43.2067 25.574 42.231 23.884L33.1695 29.1157ZM44.9359 22.3224C45.9116 24.0123 48.0726 24.5913 49.7625 23.6156L51.2334 22.7665C51.3685 22.6884 51.5071 22.6202 51.6483 22.5618C52.1905 22.3371 52.647 21.993 53 21.5727C53.3531 21.993 53.8096 22.3371 54.3517 22.5618C54.4929 22.6202 54.6315 22.6884 54.7667 22.7665L56.2375 23.6156C57.9275 24.5913 60.0884 24.0123 61.0641 22.3224L56.5334 19.7065C56.2641 19.5511 55.9871 19.4147 55.7043 19.2976C55.1536 19.0694 54.5809 18.9138 54.0002 18.8308C53.932 18.8211 53.8637 18.8124 53.7953 18.8046C53.2669 18.7448 52.7332 18.7448 52.2047 18.8046C52.1363 18.8124 52.068 18.8211 51.9998 18.8308C51.4191 18.9138 50.8464 19.0694 50.2957 19.2976C50.0129 19.4147 49.736 19.5511 49.4667 19.7065L44.9359 22.3224ZM63.769 23.884C62.7933 25.574 63.3724 27.735 65.0623 28.7107L68.0039 30.409C69.6939 31.3847 71.8549 30.8057 72.8306 29.1157L63.769 23.884ZM75.5355 30.6774C74.5598 32.3674 75.1388 34.5283 76.8288 35.504L78.2996 36.3532C78.4348 36.4312 78.5631 36.5172 78.6844 36.6102C79.15 36.9674 79.6762 37.1907 80.2168 37.2863C80.0293 37.8022 79.9596 38.3696 80.0361 38.9514C80.056 39.1029 80.0663 39.2571 80.0663 39.4132V41.1115C80.0663 43.0629 81.6482 44.6448 83.5996 44.6448V39.4132C83.5996 39.1022 83.5792 38.7942 83.5392 38.4907C83.4615 37.8997 83.3099 37.326 83.0914 36.7816C83.0657 36.7176 83.0392 36.6541 83.0117 36.591C82.7992 36.1035 82.5324 35.6412 82.2163 35.2135C82.1754 35.1581 82.1337 35.1033 82.0912 35.0491C81.729 34.5877 81.3079 34.1695 80.8349 33.8067C80.5921 33.6204 80.3355 33.4487 80.0663 33.2932L75.5355 30.6774ZM83.5996 47.7682C81.6482 47.7682 80.0663 49.3501 80.0663 51.3015V54.6982C80.0663 56.6496 81.6482 58.2316 83.5996 58.2316V47.7682ZM83.5996 61.3549C81.6482 61.3549 80.0663 62.9369 80.0663 64.8883V66.5866C80.0663 66.7427 80.056 66.8968 80.0361 67.0483C79.9596 67.6302 80.0293 68.1976 80.2168 68.7135C79.6762 68.809 79.15 69.0324 78.6844 69.3896C78.5631 69.4826 78.4348 69.5685 78.2996 69.6466L76.8288 70.4957C75.1388 71.4714 74.5598 73.6324 75.5355 75.3224L80.0663 72.7065C80.3355 72.5511 80.5921 72.3794 80.8349 72.1931C81.3079 71.8302 81.729 71.412 82.0912 70.9506C82.1337 70.8964 82.1754 70.8417 82.2163 70.7863C82.5324 70.3585 82.7992 69.8963 83.0117 69.4087C83.0392 69.3456 83.0657 69.2821 83.0914 69.2182C83.3099 68.6738 83.4615 68.1001 83.5392 67.509C83.5792 67.2056 83.5996 66.8975 83.5996 66.5866V61.3549ZM72.8306 76.8841C71.8549 75.1941 69.6939 74.6151 68.0039 75.5908L65.0623 77.2891C63.3724 78.2648 62.7933 80.4258 63.769 82.1157L72.8306 76.8841ZM61.0641 83.6774C60.0884 81.9874 57.9275 81.4084 56.2375 82.3841L54.7667 83.2333C54.6315 83.3113 54.4929 83.3795 54.3517 83.438C53.8096 83.6627 53.3531 84.0067 53 84.4271C52.647 84.0067 52.1905 83.6627 51.6483 83.438C51.5071 83.3795 51.3685 83.3113 51.2334 83.2333L49.7625 82.3841C48.0726 81.4084 45.9116 81.9874 44.9359 83.6774L49.4667 86.2933C49.736 86.4487 50.0129 86.585 50.2957 86.7022C50.8464 86.9304 51.4191 87.086 51.9998 87.1689C52.068 87.1787 52.1363 87.1874 52.2047 87.1952C52.7332 87.255 53.2669 87.255 53.7953 87.1952C53.8637 87.1874 53.932 87.1787 54.0002 87.1689C54.5809 87.086 55.1536 86.9304 55.7043 86.7022C55.9871 86.585 56.2641 86.4487 56.5333 86.2933L61.0641 83.6774ZM42.231 82.1157C43.2067 80.4258 42.6277 78.2648 40.9377 77.2891L37.9961 75.5908C36.3061 74.6151 34.1452 75.1941 33.1695 76.8841L42.231 82.1157ZM30.4645 75.3224C31.4402 73.6324 30.8612 71.4714 29.1713 70.4957L27.7004 69.6466C27.5653 69.5685 27.4369 69.4826 27.3157 69.3896C26.85 69.0324 26.3238 68.809 25.7833 68.7135C25.9708 68.1976 26.0405 67.6302 25.964 67.0483C25.944 66.8968 25.9338 66.7427 25.9338 66.5866V64.8883C25.9338 62.9369 24.3519 61.3549 22.4005 61.3549V66.5866C22.4005 66.8975 22.4209 67.2056 22.4608 67.509C22.5385 68.1001 22.6901 68.6738 22.9086 69.2182C22.9343 69.2821 22.9609 69.3456 22.9884 69.4087C23.2008 69.8963 23.4677 70.3585 23.7837 70.7863C23.8246 70.8417 23.8663 70.8964 23.9089 70.9506C24.2711 71.412 24.6921 71.8302 25.1651 72.1931C25.408 72.3794 25.6645 72.5511 25.9338 72.7065L30.4645 75.3224ZM22.4005 58.2316C24.3519 58.2316 25.9338 56.6496 25.9338 54.6982V51.3015C25.9338 49.3501 24.3519 47.7682 22.4005 47.7682V58.2316Z"
								fill="#7B6B5B"
							/>
							<path
								d="M53 38.8662L65.2398 45.9329V60.0662L53 67.1329L40.7602 60.0662V45.9329L53 38.8662Z"
								fill="#1D1511"
							/>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M53 42.9462L44.2935 47.9728V58.0262L53 63.0529L61.7065 58.0262V47.9728L53 42.9462ZM65.2398 45.9329L53 38.8662L40.7602 45.9329V60.0662L53 67.1329L65.2398 60.0662V45.9329Z"
								fill="#E2C4A1"
							/>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M52.9998 99.3486C78.5977 99.3486 99.3489 78.5974 99.3489 52.9995C99.3489 27.4017 78.5977 6.65052 52.9998 6.65052C27.402 6.65052 6.65083 27.4017 6.65083 52.9995C6.65083 78.5974 27.402 99.3486 52.9998 99.3486ZM52.9998 102.882C80.5491 102.882 102.882 80.5488 102.882 52.9995C102.882 25.4503 80.5491 3.11719 52.9998 3.11719C25.4506 3.11719 3.11749 25.4503 3.11749 52.9995C3.11749 80.5488 25.4506 102.882 52.9998 102.882Z"
								fill="#E2C4A1"
							/>
						</svg>
					</div>
					<main tw="flex p-26 pb-32 flex-row w-full h-full flex-grow items-end justify-between">
						<div tw="text-[50px] text-[#E2C4A1] leading-tight pr-10">
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
						name: 'Maison',
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
