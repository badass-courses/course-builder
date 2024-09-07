import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { and, eq, or, sql } from 'drizzle-orm'

export const runtime = 'edge'

export const revalidate = 60
export const contentType = 'image/png'

export default async function TutorialOG({
	params,
}: {
	params: { module: string }
}) {
	const resource = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					params.module,
				),
				eq(contentResource.id, params.module),
			),
			eq(contentResource.type, 'tutorial'),
		),
	})
	const rift = fetch(
		new URL('../../../../styles/fonts/rift_600_normal.woff', import.meta.url),
	).then((res) => res.arrayBuffer())
	const dmSans = fetch(
		new URL('../../../../../public/fonts/DMSans-Medium.ttf', import.meta.url),
	).then((res) => res.arrayBuffer())

	return new ImageResponse(
		(
			<div
				tw="flex h-full w-full bg-black flex-col py-10 px-24"
				style={{
					backgroundImage: `url("${process.env.NEXT_PUBLIC_URL}/assets/og-bg-simple@2x.jpg")`,
					backgroundSize: '1200px 630px',
					width: 1200,
					height: 630,
					padding: 10,
					borderBottom: '8px solid #F28D5A',
				}}
			>
				<main tw="flex bg-background flex-row w-full gap-5 h-full flex-grow items-center text-left justify-center">
					<div tw="flex flex-col pl-40 -mr-16">
						<div
							tw="text-[32px] text-white text-[#F28F5A]"
							style={{
								...font('dmsans'),
							}}
						>
							Free Tutorial
						</div>
						<div
							tw="text-[86px] text-white"
							style={{
								...font('rift'),
							}}
						>
							{resource?.fields?.title}
						</div>
						<div tw="flex items-center mt-10">
							<img
								src={`${process.env.NEXT_PUBLIC_URL}/instructor.png`}
								width={80}
								height={80}
								tw="rounded-md"
							/>
							<span
								tw="text-3xl text-white font-sans ml-5"
								style={{
									...font('dmsans'),
								}}
							>
								Adam Elmore
							</span>
						</div>
					</div>
					{resource?.fields?.coverImage?.url && (
						<div tw="flex relative mr-24">
							<img
								src={resource?.fields?.coverImage?.url}
								width={480}
								height={480}
							/>
						</div>
					)}
				</main>
			</div>
		),
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: 'rift',
					data: await rift,
				},
				{
					name: 'dmsans',
					data: await dmSans,
				},
			],
		},
	)
}

// lil helper for more succinct styles
function font(fontFamily: string) {
	return { fontFamily }
}
