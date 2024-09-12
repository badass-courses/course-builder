import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource, users } from '@/db/schema'
import { checkCertificateEligibility } from '@/lib/certificates'
import { fsBraboWeb } from '@/utils/load-fonts'
import { format } from 'date-fns'
import { and, eq, or, sql } from 'drizzle-orm'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

export const runtime = 'edge'
export const revalidate = 60
// export const contentType = 'image/png'

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)

		const hasResource = searchParams.has('resource')
		const resourceSlugOrID = hasResource ? searchParams.get('resource') : null
		if (!resourceSlugOrID) {
			return new Response(JSON.stringify({ error: 'Missing resource' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}
		const hasUser = searchParams.has('user')
		const userId = hasUser ? searchParams.get('user') : null

		if (!userId) {
			return new Response(JSON.stringify({ error: 'Missing user' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const { hasCompletedModule, date } = await checkCertificateEligibility(
			resourceSlugOrID,
			userId,
		)

		if (!hasCompletedModule) {
			return new Response(JSON.stringify({ error: 'Module not completed' }), {
				status: 422,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const user = await db.query.users.findFirst({
			where: or(eq(users.id, userId), eq(users.email, userId)),
		})

		if (!user) {
			return new Response(JSON.stringify({ error: 'User not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const resource = await db.query.contentResource.findFirst({
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

		if (!resource) {
			return new Response(JSON.stringify({ error: 'Resource not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const fontData = await fetch(
			new URL(
				'../../../../public/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		const baseUrl = process.env.NEXT_PUBLIC_URL || new URL(request.url).origin
		const signatureUrl = new URL(
			'/assets/nick-signature.png',
			baseUrl,
		).toString()

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full items-center justify-center bg-white flex-col"
					style={{
						fontFamily: 'Maison',
						background: 'linear-gradient(105deg, #FFF 0.91%, #F7F7F9 100%)',
						lineHeight: 1,
						width: 842 * 2,
						height: 595 * 2,
					}}
				>
					<div tw="absolute flex items-center justify-center left-0 top-0 w-full h-full">
						<Background />
					</div>
					<div tw="flex flex-col items-center leading-none text-center justify-center w-full">
						<img
							src={resource?.fields?.coverImage.url}
							width={500}
							height={500}
						/>
						<h1
							style={{
								fontSize: 75,
								lineHeight: 0.2,
							}}
							className="font-bold"
						>
							Certificate of Completion
						</h1>
						<div
							style={{
								fontSize: 50,
								maxWidth: 700,
							}}
							tw="flex mt-24 border-b-2 border-gray-500 pb-4 w-full flex-col items-center justify-center text-center"
						>
							{user.name}
						</div>
						<div
							style={{
								fontSize: 24,
								maxWidth: 700,
								lineHeight: 1.3,
							}}
							tw="flex mt-10 w-full flex-col items-center justify-center text-center"
						>
							Has Successfully Completed the {resource?.fields?.title} Workshop.
						</div>
					</div>
					<div
						tw={`absolute flex items-center justify-center left-32 bottom-32 font-sans ${GeistSans.variable} ${GeistMono.variable} ${fsBraboWeb.variable}`}
					>
						Value-Based Design
					</div>
					<div tw="absolute flex items-center justify-center bottom-24">
						<img src={signatureUrl} height={87} width={225} />
					</div>
					<div tw="absolute flex items-center text-xl justify-center bottom-32 right-32">
						{date && `${format(date, 'MMMM do, y')}`}
					</div>
				</div>
			),
			{
				width: 842 * 2,
				height: 595 * 2,
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
		return new Response('Failed to generate certificate', { status: 500 })
	}
}

const Background = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={842 * 2}
			height={595 * 2}
			fill="none"
			viewBox="0 0 842 595"
		>
			<path fill="#fff" d="M0 0h842v595H0z" />
			<circle
				cx="22.102"
				cy="25.244"
				r="5.102"
				fill="#fff"
				stroke="#000"
				stroke-width="2"
			/>
			<path
				fill="#000"
				d="M794.262 25.244h1v-1h-1v1Zm-746.524 0v-1h-1v1h1Zm772.16 25.636h1v-1h-1v1Zm0 493.24v1h1v-1h-1Zm-25.636 25.636v1h1v-1h-1Zm-746.524 0h-1v1h1v-1ZM22.102 544.12h-1v1h1v-1Zm0-493.24v-1h-1v1h1Zm772.16-26.636H47.738v2h746.524v-2Zm25.636 25.636c-13.606 0-24.636-11.03-24.636-24.636h-2c0 14.711 11.925 26.636 26.636 26.636v-2Zm1 494.24V50.88h-2v493.24h2Zm-25.636 25.636c0-13.606 11.03-24.636 24.636-24.636v-2c-14.711 0-26.636 11.925-26.636 26.636h2Zm-747.524 1h746.524v-2H47.738v2ZM22.102 545.12c13.606 0 24.636 11.03 24.636 24.636h2c0-14.711-11.925-26.636-26.636-26.636v2Zm-1-494.24v493.24h2V50.88h-2Zm25.636-25.636c0 13.606-11.03 24.636-24.636 24.636v2c14.71 0 26.636-11.925 26.636-26.636h-2Z"
			/>
			<path
				stroke="#9C9C9C"
				d="M54.257 32.243h733.486c0 13.795 11.183 24.977 24.977 24.977v480.56c-13.794 0-24.977 11.182-24.977 24.977H54.257c0-13.795-11.183-24.977-24.977-24.977V57.22c13.794 0 24.977-11.182 24.977-24.977Z"
			/>
			<circle
				cx="22.102"
				cy="569.756"
				r="5.102"
				fill="#fff"
				stroke="#000"
				stroke-width="2"
			/>
			<circle
				cx="819.898"
				cy="25.244"
				r="5.102"
				fill="#fff"
				stroke="#000"
				stroke-width="2"
			/>
			<circle
				cx="819.898"
				cy="569.756"
				r="5.102"
				fill="#fff"
				stroke="#000"
				stroke-width="2"
			/>
		</svg>
	)
}
