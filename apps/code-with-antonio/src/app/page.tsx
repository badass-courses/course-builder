import React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { CompanyLogos } from '@/components/brand/company-logos'
import {
	HeroBackground,
	HeroIllustration,
	SubscribeFormIllustration,
} from '@/components/brand/svgs'
import { CldImage } from '@/components/cld-image'
import ResourceTeaser from '@/components/content/resource-teaser'
import LayoutClient from '@/components/layout-client'
import config from '@/config'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import { getActiveCoupon, getSaleBannerData } from '@/lib/sale-banner'
import { getAllWorkshops } from '@/lib/workshops-query'
import { compileMDX } from '@/utils/compile-mdx'
import { ChevronRight } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const searchParams = await props.searchParams
	const activeCoupon = await getActiveCoupon(searchParams)

	const ogImageUrl = activeCoupon
		? 'https://res.cloudinary.com/total-typescript/image/upload/v1730364326/aihero-golden-ticket_2x_qghsfq.png'
		: config.openGraph.images[0]!.url

	return {
		title: {
			template: '%s | Code with Antonio',
			default: `Build something great! - Code with Antonio`,
		},
		openGraph: {
			images: ogImageUrl ? [{ url: ogImageUrl }] : [],
		},
	}
}

type Props = {
	searchParams: Promise<{ [key: string]: string | undefined }>
}

const Home = async (props: Props) => {
	// const searchParams = await props.searchParams
	// const { allowPurchase, pricingDataLoader, product, commerceProps } =
	// 	await getPricingProps({ searchParams })
	const isCommerceEnabled = await commerceEnabled()
	// const page = await getPage('homepage-default')
	// const firstPageResource = page?.resources?.[0] && {
	// 	path: page.resources[0]?.resource?.fields?.slug,
	// 	title: page.resources[0]?.resource?.fields?.title,
	// }
	const searchParams = await props.searchParams
	const activeCoupon = await getActiveCoupon(searchParams)
	const saleBannerData = await getSaleBannerData(activeCoupon)
	// const { content: bodyContent } = await compileMDX(page?.fields?.body || '')
	const workshops = await getAllWorkshops()
	return (
		<LayoutClient
			saleBannerData={saleBannerData}
			isCommerceEnabled={isCommerceEnabled}
		>
			<div>
				<section className="bg-primary dark:bg-primary-dark text-primary-foreground relative flex w-full flex-col items-center justify-center overflow-hidden py-8">
					<HeroBackground
						size={0.6}
						className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full select-none opacity-10"
					/>
					<div className="container relative z-10 flex w-full grid-cols-2 flex-col-reverse lg:grid">
						<div className="flex flex-col items-center justify-center gap-4 text-center sm:items-start sm:text-left">
							<h1 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
								Build your career on modern full-stack skills
							</h1>
							<h2 className="text-lg font-normal sm:text-xl lg:text-2xl">
								Join cohort-based courses with Antonio and get really good at
								modern development
							</h2>
							<Button asChild variant="secondary" size="lg" className="mt-4">
								<Link href="/browse">
									Browse courses <ChevronRight className="size-4" />
								</Link>
							</Button>
						</div>
						<div className="relative hidden items-center justify-center lg:flex">
							<HeroIllustration className="-mb-8" />
						</div>
					</div>
				</section>
				{/* <section>
					<div className="container py-8 sm:py-20">
						<ResourceTeaser
							label="New Cohort-based Course"
							title="Building AI-Powered Applications with React and Next.js"
							description="Discover effective strategies to enhance AI applications swiftly. Create AI solutions that outperform competitors, no matter the scenario."
							href="/courses/ai-powered-apps"
							badgeText="9 days left to enroll"
							dateText="Starts Oct 8"
							thumbnailBadge="NEW"
							thumbnailUrl="https://res.cloudinary.com/dezn0ffbx/image/upload/v1760523672/thumbnail-cohort_2x_wwn6oa.jpg"
						/>
					</div>
				</section> */}
				{workshops && workshops.length > 0 && (
					<section className="bg-muted">
						<div className="container pb-0 pt-7 md:py-20">
							<div className="flex w-full items-center justify-between pb-5 md:pb-16">
								<h2 className="text-foreground text-2xl font-medium leading-9 md:text-3xl">
									Featured Self-paced Courses
								</h2>
							</div>
							<div className="-mx-6 flex snap-x flex-row gap-5 overflow-x-auto px-6 pb-5 md:mx-0 md:grid md:grid-cols-3 md:px-0 md:pb-0 [&_a]:shrink-0 [&_a]:basis-2/3 [&_a]:snap-center">
								{workshops.map((workshop) => (
									<ResourceTeaser
										key={workshop.id}
										variant="card"
										title={workshop.fields.title}
										metadata={`${workshop.resources?.length ?? 0} chapters`}
										tags={
											workshop.tags?.map((tag) => tag.tag.fields?.label) ?? []
										}
										href={`/workshops/${workshop.fields.slug}`}
										// thumbnailBadge="FREE"
										thumbnailUrl={workshop.fields.coverImage?.url}
									/>
								))}
							</div>
						</div>
					</section>
				)}
				<section>
					<div className="container flex grid-cols-2 flex-col-reverse items-center gap-7 py-7 md:grid md:gap-16 md:py-20">
						<div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
							<h2 className="text-muted-foreground text-sm font-medium uppercase">
								Builder's List
							</h2>
							<h3 className="text-foreground text-3xl font-medium leading-9">
								Early access to cohorts on React/Next/AI and a limited launch
								discount.
							</h3>
							<h4 className="text-muted-foreground">
								Join builder’s list to get notified when new cohorts open,
								unlock early-bird pricing, and never miss a new course.
							</h4>
							<SubscribeToConvertkitForm className="mt-3 flex w-full max-w-sm flex-col items-start gap-3 text-left lg:max-w-full lg:flex-row lg:items-end" />
						</div>
						<div className="bg-primary text-primary-foreground relative flex items-center justify-center overflow-hidden rounded-lg">
							<CldImage
								src="https://res.cloudinary.com/dezn0ffbx/image/upload/v1760601130/email-illustration_2x_aidhz4.jpg"
								width={1176 / 2}
								height={640 / 2}
								alt=""
							/>
							{/* <HeroBackground
								size={10}
								className="absolute inset-0 z-0 h-full w-full object-cover opacity-30"
							/>
							<SubscribeFormIllustration className="relative z-50" /> */}
						</div>
					</div>
				</section>
				<section className="bg-muted">
					<div className="max-w-(--breakpoint-lg) container flex flex-col gap-10 py-10 md:py-20">
						<p className="text-muted-foreground text-center text-sm">
							Used by engineers from the world's most innovative teams
						</p>
						<CompanyLogos />
					</div>
				</section>
			</div>
		</LayoutClient>
	)
}

export default Home
