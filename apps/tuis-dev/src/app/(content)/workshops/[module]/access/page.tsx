import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCsrf } from '@/app/(user)/login/actions'
import { CompanyLogos } from '@/components/brand/company-logos'
import { Logo, LogoMark } from '@/components/brand/logo'
import { CldImage } from '@/components/cld-image'
import LayoutClient from '@/components/layout-client'
import { Login } from '@/components/login'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getCachedMinimalWorkshop } from '@/lib/workshops-query'
import { getProviders, getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { and, eq } from 'drizzle-orm'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Card, CardContent } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export const dynamic = 'force-dynamic'

type Props = {
	params: Promise<{ module: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateStaticParams() {
	try {
		const workshops = await db.query.contentResource.findMany({
			where: and(eq(contentResource.type, 'workshop')),
		})

		return workshops
			.filter((workshop) => Boolean(workshop.fields?.slug))
			.map((workshop) => ({
				module: workshop.fields?.slug,
			}))
	} catch (error) {
		// If database is unavailable during build, return empty array
		// Pages will be generated on-demand instead
		await log.warn('page.workshop.generate_static_params.failed', {
			message:
				'Failed to generate static params for workshops, database may be unavailable.',
			error,
		})
		return []
	}
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const workshop = await getCachedMinimalWorkshop(params.module)

	if (!workshop) {
		return parent as Metadata
	}

	return {
		title: workshop.fields?.title,
		description: workshop.fields?.description,
		openGraph: {
			images: [
				workshop.fields?.coverImage?.url
					? {
							url: workshop.fields.coverImage.url,
							alt: workshop.fields.title || '',
						}
					: getOGImageUrlForResource(
							workshop as unknown as ContentResource & {
								fields?: { slug: string }
							},
						),
			],
		},
	}
}

export default async function WorkshopAccessPage(props: Props) {
	await headers()

	const params = await props.params
	const { session } = await getServerAuthSession()

	// Redirect signed-in users to the workshop page
	if (session?.user) {
		redirect(`/workshops/${params.module}`)
	}

	const workshop = await getCachedMinimalWorkshop(params.module)

	if (!workshop) {
		notFound()
	}

	const providers = getProviders()
	const csrfToken = await getCsrf()

	const workshopTitle = workshop.fields.title

	return (
		<LayoutClient
			withFooter={false}
			withNavigation={false}
			className="bg-muted flex min-h-[100svh] flex-col items-center justify-center py-10"
		>
			<div className="container relative z-10 md:py-16">
				<div className="grid w-full grid-cols-1 items-center gap-24 md:grid-cols-2 md:gap-10">
					<div className="flex flex-col gap-4">
						<h1 className="mb-4 text-3xl font-semibold sm:text-4xl lg:text-5xl">
							Unlock the <strong className="font-bold">{workshopTitle}</strong>{' '}
							kit for free
						</h1>
						<div className="">
							<h2 className="mb-4 text-sm font-medium uppercase opacity-80 md:text-base">
								Get access to:
							</h2>
							<ul className="flex flex-col space-y-2 md:text-lg">
								{[
									'Complete source code',
									'All videos',
									'Progress tracking',
									'Certificate of completion',
								].map((item) => (
									<li key={item} className="flex items-center gap-2">
										<span className="mt-1">
											<CheckmarkIcon />
										</span>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
					<div className="relative flex w-full flex-col items-center md:ml-auto md:max-w-lg">
						{workshop.fields.coverImage?.url && (
							<CldImage
								src={workshop.fields.coverImage.url}
								alt={workshop.fields.title}
								width={219}
								height={123}
								className="absolute -top-16 z-50 rounded-lg shadow-lg"
							/>
						)}
						<div className="bg-primary relative w-full overflow-hidden rounded-lg p-[2px] shadow-lg">
							<div
								className="absolute inset-0 scale-150 rounded-lg"
								style={{
									background:
										'conic-gradient(from 0deg, transparent 0deg, oklch(0.746 0.245 262.881) 60deg, oklch(0.6 0.2 180) 120deg, transparent 180deg)',
									animation: 'spin 10s linear infinite',
								}}
							/>
							<div
								className="absolute inset-0 scale-150 rounded-lg"
								style={{
									background:
										'conic-gradient(from 180deg, transparent 0deg, oklch(0.746 0.245 262.881) 60deg, oklch(0.6 0.2 180) 120deg, transparent 180deg)',
									animation: 'spin 10s linear infinite',
								}}
							/>
							<Login
								className={cn(
									'bg-card relative z-10 w-full rounded-[10px] border-0 [&_button]:h-14 [&_button]:text-base [&_button]:font-semibold [&_h1]:text-2xl lg:[&_h1]:text-3xl [&_input]:h-12 [&_input]:text-base',
									{
										'pt-16': workshop.fields.coverImage?.url,
									},
								)}
								csrfToken={csrfToken}
								providers={providers}
								callbackUrl={`/workshops/${params.module}`}
								title="Enter your name and email to get instant access"
								buttonLabel="Get Instant Access"
								showFirstName
								firstNameLabel="First Name"
								firstNamePlaceholder="Your first name (optional)"
								checkYourEmailPageContext={{
									title: workshop.fields.title,
									resourceSlug: params.module,
									coverImage: workshop.fields.coverImage?.url,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-4 px-5 pt-10 md:px-0 md:pt-16">
				<p className="text-muted-foreground mb-6 text-center text-sm">
					Used by engineers from the world's most innovative teams
				</p>
				<CompanyLogos />
			</div>
			<Link
				href="/"
				className="absolute left-5 top-5 hidden items-center gap-2 md:flex"
			>
				TUIs.dev
			</Link>
			<svg
				preserveAspectRatio="none"
				className="absolute z-0 w-full dark:opacity-50"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 1970 388"
			>
				<path
					stroke="url(#a)"
					d="M.146 353.925c108.667 33.334 391.126 76.414 619-71 388.004-251 946.524-378.52 1350.004-197"
				/>
				<defs>
					<linearGradient
						id="a"
						x1=".146"
						x2="1969.15"
						y1="193.561"
						y2="193.561"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="var(--color-muted)" />
						<stop offset=".5" stopColor="var(--color-border)" />
						<stop offset="1" stopColor="var(--color-muted)" />
					</linearGradient>
				</defs>
			</svg>
		</LayoutClient>
	)
}

const CheckmarkIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			className="text-primary size-5"
		>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="1.5"
				d="M17 3.338A9.954 9.954 0 0 0 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-.685-.069-1.354-.2-2"
			/>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
				d="M8 12.5s1.5 0 3.5 3.5c0 0 5.559-9.167 10.5-11"
			/>
		</svg>
	)
}
