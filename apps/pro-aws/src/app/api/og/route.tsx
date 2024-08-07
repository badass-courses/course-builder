// EXAMPLE USAGE
// with resource: https://pronextjs.dev/api/og?resource=[SLUG_OR_ID]
// with custom title: https://pronextjs.dev/api/og?title=ANYTHING

import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { and, eq, or, sql } from 'drizzle-orm'

export const runtime = 'edge'
export const revalidate = 60
// export const contentType = 'image/png'

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const hasResource = searchParams.has('resource')
		const resourceSlugOrID = hasResource ? searchParams.get('resource') : null
		const hasTitle = searchParams.has('title')

		let title
		if (resourceSlugOrID && !hasTitle) {
			const resource = await db.query.contentResource.findFirst({
				where: and(
					or(
						eq(
							sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
							resourceSlugOrID,
						),
						eq(contentResource.id, resourceSlugOrID),
					),
					// eq(contentResource.type, 'article'),
				),
			})
			title = resource?.fields?.title
		} else {
			if (hasTitle) {
				title = searchParams.get('title')?.slice(0, 100)
			} else {
				title = 'Navigate the AWS Maze with Confidence'
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
						background: 'linear-gradient(105deg, #080808 0.91%, #101010 100%)',
						width: 1200,
						height: 630,
					}}
				>
					<div tw="flex items-center gap-2 justify-center absolute left-26 top-26">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className=""
							width={99 * 1}
							height={102 * 1}
							fill="none"
							viewBox="0 0 99 102"
						>
							<path
								fill="#C7C7C7"
								d="M76.355 41.974v-26.15L49.503.315 22.65 15.823v26.15L0 55.053v31.006l26.853 15.506 22.65-13.078 22.646 13.078 26.855-15.506V55.052l-22.65-13.078ZM90.597 64.76v16.443L72.15 91.853 57.912 83.63l32.686-18.87h-.001ZM35.26 18.25l14.24-8.224 18.444 10.65v16.442L35.261 18.25v.002Zm-4.204 13.718a3.68 3.68 0 0 1 1.859-3.22 3.705 3.705 0 0 1 1.858-.502 3.69 3.69 0 0 1 1.858.505L80.814 54.26a3.678 3.678 0 0 1 1.859 3.219 3.677 3.677 0 0 1-1.859 3.217l-44.182 25.51a3.68 3.68 0 0 1-3.716 0 3.68 3.68 0 0 1-1.859-3.22V31.968ZM22.65 51.685v37.74L8.41 81.204V59.906l14.24-8.22v-.001Z"
							/>
							<path
								fill="#C7C7C7"
								d="M157.882 55.222c2.703-3.128 4.072-7.32 4.072-12.456 0-3.428-.651-6.527-1.935-9.21-1.277-2.668-3.09-4.768-5.385-6.243-2.295-1.474-4.984-2.22-7.992-2.22h-17.148v60.612h9.466V59.913h8.207c4.424 0 8.029-1.578 10.717-4.693l-.002.002Zm-18.148-2.587c-.478 0-.774-.298-.774-.776V33.935c0-.479.296-.774.774-.774h5.246c2.257 0 4.098.911 5.473 2.71 1.35 1.772 2.035 4.18 2.035 7.157 0 2.977-.685 5.272-2.039 6.986-1.375 1.74-3.214 2.62-5.469 2.62h-5.246Zm43.055-1.286c1.145-.352 2.747-.376 4.341.097.252.075.491.154.698.223l1.656-9.63a16.3 16.3 0 0 0-.463-.2c-1.12-.476-2.119-.66-3.561-.66-3.437 0-5.852 1.79-7.381 5.474-.025.113-.101.337-.298.454a.478.478 0 0 1-.365.049c-.155-.039-.427-.185-.427-.72v-4.732h-9.465v43.914h9.465V60.164c0-2.27.533-4.258 1.584-5.908 1.07-1.682 2.488-2.66 4.214-2.907h.002Zm24.791-10.343c-4.668 0-8.414 1.28-11.136 3.802-2.712 2.516-4.087 5.918-4.087 10.113v17.574c0 4.254 1.361 7.672 4.045 10.156 2.689 2.494 6.451 3.757 11.18 3.757s8.576-1.265 11.268-3.757c2.685-2.488 4.046-5.905 4.046-10.156V54.921c0-4.193-1.377-7.597-4.089-10.113-2.723-2.523-6.499-3.802-11.225-3.802h-.002Zm5.847 30.7c0 1.943-.543 3.533-1.615 4.73-1.082 1.206-2.506 1.817-4.23 1.817-1.724 0-3.136-.613-4.19-1.82-1.04-1.194-1.569-2.784-1.569-4.726V55.619c0-1.944.527-3.532 1.569-4.726 1.054-1.208 2.464-1.822 4.19-1.822 1.726 0 3.151.628 4.233 1.866 1.07 1.224 1.613 2.8 1.613 4.682v16.088h-.001Zm35.879.364 2.187 13.637h9.615l-11.409-60.508H237.5l-11.237 60.508h9.093l2.184-13.636h11.766Zm-5.885-37.41 4.68 29.697h-9.357l4.677-29.696Zm61.848-9.462-5.3 45.68-8.22-45.68h-8.524l-8.223 45.68-5.298-45.68h-9.268l9.509 60.509h9.306l8.148-43.453 8.147 43.453h8.958l9.507-60.508h-8.742Zm27.774 61.208h.174c10.085 0 14.783-3.948 14.783-12.421v-8.83c0-6.59-3.635-9.146-9.18-12.29l-7.167-4.02c-3.11-1.79-4.107-3.369-4.107-6.5v-4.196c0-3.652 1.9-5.583 5.497-5.583 3.596 0 5.495 1.931 5.495 5.583v8.227h9.288V36.75c0-10.657-9.206-12.248-14.694-12.248h-.176c-5.488 0-14.696 1.59-14.696 12.248v8.04c0 5.976 2.961 8.725 9.184 12.296l7.078 4.02c3.134 1.7 4.192 3.385 4.192 6.674v4.807c0 3.66-2.035 5.758-5.584 5.758-3.55 0-5.584-2.098-5.584-5.758v-8.926h-9.288v10.325c0 8.476 4.698 12.422 14.785 12.422v-.002ZM76.355 41.974v-26.15L49.503.315 22.65 15.823v26.15L0 55.053v31.006l26.853 15.506 22.65-13.078 22.646 13.078 26.855-15.506V55.052l-22.65-13.078ZM90.597 64.76v16.443L72.15 91.853 57.912 83.63l32.686-18.87h-.001ZM35.26 18.25l14.24-8.224 18.444 10.65v16.442L35.261 18.25v.002Zm-4.204 13.718a3.68 3.68 0 0 1 1.859-3.22 3.705 3.705 0 0 1 1.858-.502 3.69 3.69 0 0 1 1.858.505L80.814 54.26a3.678 3.678 0 0 1 1.859 3.219 3.677 3.677 0 0 1-1.859 3.217l-44.182 25.51a3.68 3.68 0 0 1-3.716 0 3.68 3.68 0 0 1-1.859-3.22V31.968ZM22.65 51.685v37.74L8.41 81.204V59.906l14.24-8.22v-.001Z"
							/>
						</svg>
					</div>
					<main tw="flex p-26 pb-32 flex-colw-full gap-5 h-full flex-grow items-end justify-start">
						<div tw="text-[50px] text-white leading-tight">{title}</div>
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
