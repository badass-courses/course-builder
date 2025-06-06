import { ImageResponse } from 'next/og'
import Background from '@/components/certificates/background'
import Logo from '@/components/certificates/logo'
import Signature from '@/components/certificates/signature'
import { db } from '@/db'
import { contentResource, users } from '@/db/schema'
import {
	checkCertificateEligibility,
	checkCohortCertificateEligibility,
} from '@/lib/certificates'
import { format } from 'date-fns'
import { and, eq, or, sql } from 'drizzle-orm'

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

		let isEligible = false
		let completedAt: Date | null | undefined = null

		if (resource.type === 'cohort') {
			const { hasCompletedCohort, date } =
				await checkCohortCertificateEligibility(resource.id, userId)
			isEligible = hasCompletedCohort
			completedAt = date
		} else {
			const { hasCompletedModule, date } = await checkCertificateEligibility(
				resourceSlugOrID,
				userId,
			)
			isEligible = hasCompletedModule
			completedAt = date
		}

		if (!isEligible) {
			return new Response(
				JSON.stringify({ error: 'Not eligible for certificate' }),
				{
					status: 422,
					headers: { 'Content-Type': 'application/json' },
				},
			)
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

		const fontData = await fetch(
			new URL(
				'../../../../public/fonts/79122e33-d8c9-4b2c-8add-f48bd7b317e0.ttf',
				import.meta.url,
			),
		).then((res) => res.arrayBuffer())

		return new ImageResponse(
			(
				<div
					tw="flex h-full w-full items-center justify-center bg-black flex-col"
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
						{/* <img
							src={resource?.fields?.coverImage.url}
							width={500}
							height={500}
						/> */}
						<h1
							style={{
								fontSize: 75,
								lineHeight: 0.2,
								color: '#fff',
							}}
							className="font-bold text-white"
						>
							Certificate of Completion
						</h1>
						<div
							style={{
								fontSize: 50,
								maxWidth: 700,
							}}
							tw="flex mt-24 border-b-2 border-gray-500 pb-4 w-full flex-col items-center justify-center text-center text-white"
						>
							{user.name}
						</div>
						<div
							style={{
								fontSize: 24,
								maxWidth: 700,
								lineHeight: 1.3,
							}}
							tw="flex mt-10 w-full flex-col items-center justify-center text-center text-white"
						>
							Has Successfully Completed the {resource?.fields?.title}{' '}
							{resource.type === 'cohort' ? 'Cohort' : 'Workshop'}.
						</div>
					</div>
					<div tw="absolute flex items-center justify-center left-32 bottom-32">
						<Logo />
					</div>
					<div tw="absolute flex items-center justify-center bottom-24 text-white">
						<Signature />
					</div>
					<div tw="absolute flex items-center text-xl justify-center bottom-32 right-32 text-white">
						{completedAt && `${format(completedAt, 'MMMM do, y')}`}
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
