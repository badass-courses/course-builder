import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource, users } from '@/db/schema'
import { checkCertificateEligibility } from '@/lib/certificates'
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
							Has Successfully Completed the {resource?.fields?.title} Workshop.
						</div>
					</div>
					<div tw="absolute flex items-center justify-center left-32 bottom-32">
						<Logo />
					</div>
					<div tw="absolute flex items-center justify-center bottom-24 text-white">
						<Signature />
					</div>
					<div tw="absolute flex items-center text-xl justify-center bottom-32 right-32 text-white">
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

export const Signature = () => {
	return (
		<svg
			className="mx-auto w-32 -rotate-6 pt-4 text-white"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 154 34"
		>
			<path
				fill="currentColor"
				d="M.002 20.16c.065 1.113.589 1.964 1.505 2.553 1.637.982 4.517.654 7.986-.982 8.378-3.927 13.483-11.062 13.549-11.127.13-.197.13-.458-.066-.59a.426.426 0 0 0-.589.132c-.065.065-5.105 7.003-13.287 10.8-3.142 1.505-5.76 1.832-7.2 1.047C1.245 21.6.918 20.946.853 20.16c-.066-1.833 1.767-4.975 4.843-8.247C10.867 6.415 19.311.85 26.446.85c1.177 0 1.897.393 2.225 1.047 2.16 4.778-13.353 23.957-19.506 30.96-.13.197-.13.458 0 .59.131.065.197.13.328.13a.497.497 0 0 0 .261-.13c.197-.197 20.095-20.619 31.419-31.419-1.768 3.666-6.48 12.306-10.277 18.785-2.945 3.535-5.76 7.266-5.76 8.182a.5.5 0 0 0 .131.328c.066.13.262.196.393.196.327 0 1.113 0 5.956-8.313 1.244-1.44 2.553-3.01 4.058-4.713C42.024 9.23 45.885 5.76 46.867 5.498c-.065.786-1.57 3.47-2.945 5.891-3.797 6.677-9.557 16.887-6.415 21.47.131.13.393.195.59.065a.426.426 0 0 0 .13-.59c-2.88-4.123 2.684-14.007 6.415-20.552 2.618-4.517 3.403-6.087 2.945-6.807a.654.654 0 0 0-.589-.328c-1.898 0-9.033 7.986-12.044 11.39-.327.327-.654.72-.981 1.112.261-.458.523-.916.785-1.44 3.796-6.742 7.658-14.073 7.92-15.054.131-.393-.065-.524-.196-.59-.131-.065-.328-.13-.524.066-7.004 6.61-18.262 17.934-25.593 25.396C22.78 17.477 31.224 5.63 29.391 1.571 28.933.524 27.95.065 26.445.065c-7.396 0-16.101 5.63-21.403 11.259C1.769 14.793-.064 18.13.002 20.16Zm54.935 2.03c.524 1.112 1.964 3.73 5.498 3.73 4.647 0 10.211-3.273 10.473-3.404.196-.13.262-.392.065-.589-.13-.196-.392-.261-.523-.13-.066.065-5.63 3.272-10.015 3.272-4.123 0-4.909-3.665-4.909-3.796-.065-.131-.196-.262-.327-.262-.131-.066-.328 0-.393.065-.065.066-.13.197-.262.262-.327-.196-.85-.393-1.898-.393-1.374 0-2.684 1.113-3.076 2.095-.328.655-.197 1.31.261 1.767.197.197.459.328.786.328 1.244-.066 3.338-2.03 4.32-2.946Zm-4.516 2.028c-.197-.196-.262-.458-.066-.85.262-.72 1.31-1.572 2.291-1.572.655 0 1.047.066 1.31.131-1.179 1.113-2.684 2.357-3.405 2.357-.065 0-.13-.066-.13-.066Z"
			/>
			<path
				fill="currentColor"
				d="M128.618 8.378c-20.291-.327-36-.523-48.043-.654 1.178-1.571 2.29-3.077 3.338-4.451.13-.197.13-.458-.066-.59-.196-.13-.458-.13-.589.066-.72.916-2.094 2.684-3.73 4.975-29.782-.328-36.982-.197-37.048-.197-.262 0-.393.197-.393.458 0 .197.197.393.393.393.131 0 7.2-.13 36.458.197-4.909 6.807-11.52 16.887-9.425 19.178.523.523 1.57.785 2.945.785 6.48 0 20.553-5.236 22.451-5.89.197-.132.328-.328.262-.59-.13-.196-.327-.327-.589-.196-8.77 3.273-22.516 7.462-24.48 5.302-1.505-1.637 4.254-10.866 9.884-18.59 12.109.131 28.014.328 48.632.655.197 0 .393-.196.393-.458a.422.422 0 0 0-.393-.393Z"
			/>
			<path
				fill="currentColor"
				d="M152.652 8.378c-20.29-.327-36-.523-48.043-.654 1.178-1.571 2.291-3.077 3.338-4.451.131-.197.131-.458-.065-.59-.197-.13-.459-.13-.59.066-.72.916-2.094 2.684-3.73 4.975-29.782-.328-36.982-.197-37.048-.197-.262 0-.392.197-.392.458 0 .197.196.393.392.393.131 0 7.2-.13 36.458.197-4.909 6.807-11.52 16.887-9.425 19.178.524.523 1.57.785 2.945.785 6.48 0 20.553-5.236 22.451-5.89.197-.132.328-.328.262-.59-.131-.196-.327-.327-.589-.196-8.771 3.273-22.516 7.462-24.48 5.302-1.505-1.637 4.255-10.866 9.884-18.59 12.109.131 28.014.328 48.632.655.197 0 .393-.196.393-.458a.422.422 0 0 0-.393-.393Z"
			/>
		</svg>
	)
}

const Logo = () => {
	return (
		<svg
			fill="none"
			height="69"
			viewBox="0 0 216 69"
			width="216"
			xmlns="http://www.w3.org/2000/svg"
		>
			<clipPath id="a">
				<path d="m0 0h68.3903v68.3903h-68.3903z" />
			</clipPath>
			<path
				d="m104.664 46.7701-1.528-4.458h-10.8143l-1.5273 4.458h-6.0678l10.2368-28.8943h5.5316l10.278 28.8943zm-10.5261-9.9066h7.1821l-3.5497-10.4846h-.0825zm40.1791-13.374h-6.646v17.6668h6.646v5.6138h-19.442v-5.6138h6.687v-17.6668h-6.687v-5.6137h19.442z"
				fill="#fff"
			/>
			<path
				d="m139.034 46.1442v-28.8665h3.875v9.7671h.079c1.226-1.4631 3.44-2.4516 5.655-2.4516 4.785 0 7.909 3.1239 7.909 7.9086v13.6424h-3.876v-12.9306c0-3.1239-1.779-5.022-4.784-5.022-3.006 0-4.983 2.0167-4.983 5.022v12.9306zm21.336-10.4789c0-6.5247 3.994-11.0721 9.728-11.0721 5.694 0 9.49 4.3102 9.49 10.5975v1.6213h-15.303c.04 1.8586.593 3.4403 1.661 4.6661 1.067 1.2259 2.451 1.819 4.152 1.819 2.649 0 4.231-1.0281 5.971-3.8357l3.005 2.0167c-1.858 3.4798-4.943 5.2593-8.937 5.2593-5.812 0-9.767-4.4684-9.767-11.0721zm3.994-1.819h11.389c-.159-3.4403-2.334-5.8129-5.655-5.8129-3.164 0-5.655 2.6494-5.734 5.8129zm19.272 12.2979v-20.9579h3.638v1.7399h.079c.83-1.3049 2.452-2.0958 4.389-2.0958.752 0 1.542.1186 2.333.3164l-.751 3.8752c-.83-.2373-1.542-.3559-2.175-.3559-2.412 0-3.638 1.6608-3.638 5.2988v12.1793zm11.45-10.4789c0-6.6038 4.034-11.0721 10.005-11.0721s10.004 4.4683 10.004 11.0721c0 6.6037-4.033 11.0721-10.004 11.0721s-10.005-4.4684-10.005-11.0721zm16.134 0c0-4.5871-2.333-7.4737-6.129-7.4737s-6.129 2.8866-6.129 7.4737c0 4.587 2.333 7.4736 6.129 7.4736s6.129-2.8866 6.129-7.4736z"
				fill="#fff"
			/>
			<g clipPath="url(#a)">
				<path
					d="m72.299 74.286-4.831 4.3496-29.9483-26.96v21.1241h-6.5v-20.4209l-29.16792 26.2568-4.83106-4.3496 37.63968-33.8809zm0-75.77248-.288.25879 4.1044 4.55957-26.2548 29.16792h20.9091v6.5h-21.6123l26.958 29.9483-4.3486 4.831-33.8818-37.6386 31.5478-35.04788-34.7724 31.30178-37.51273-33.76662 33.76663 37.51272-33.88088 37.6386-4.34864-4.831 26.95802-29.9483h-21.61231v-6.5h20.90921l-26.25492-29.16792 4.3418-4.8252 4.8252-4.34179 29.16792 26.25491v-20.939484h6.5v21.642584l29.9483-26.95801z"
					fill="#fff"
				/>
			</g>
		</svg>
	)
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
			<path fill="#000" d="M0 0h842v595H0z" />
			<circle
				cx="22.102"
				cy="25.244"
				r="5.102"
				fill="#000"
				stroke="#fff"
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
				fill="#000"
				stroke="#fff"
				stroke-width="2"
			/>
			<circle
				cx="819.898"
				cy="25.244"
				r="5.102"
				fill="#000"
				stroke="#fff"
				stroke-width="2"
			/>
			<circle
				cx="819.898"
				cy="569.756"
				r="5.102"
				fill="#000"
				stroke="#fff"
				stroke-width="2"
			/>
		</svg>
	)
}
