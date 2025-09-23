import * as React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { PricingWidget } from '@/components/commerce/home-pricing-widget'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import config from '@/config'
import { db } from '@/db'
import { contentResourceProduct, contentResourceResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { getPricingProps } from '@/lib/pricing-query'
import { getAllWorkshops } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
import { asc } from 'drizzle-orm'
import { FilePlus2 } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { uniqBy } from '@coursebuilder/nodash'
import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: `AI Hero Workshops by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`AI Hero Workshops by ${config.author}`)}`,
			},
		],
	},
}

export default async function Workshops(props: {
	searchParams: Promise<{ [key: string]: string | undefined }>
}) {
	const searchParams = await props.searchParams
	const { ability } = await getServerAuthSession()
	const {
		allowPurchase,
		pricingDataLoader,
		product,
		commerceProps,
		hasPurchased,
	} = await getPricingProps({ searchParams })

	return (
		<LayoutClient withContainer>
			<main className="container min-h-[calc(100vh-var(--nav-height))] px-0">
				<div className="max-w-(--breakpoint-lg) mx-auto flex h-full w-full flex-col items-center">
					<div className="w-full px-5 pb-16 pt-24">
						<h1 className="font-heading fluid-3xl text-center font-medium">
							Professional AI Workshops
						</h1>
					</div>
					<div className="relative w-full">
						<WorkshopsList />
						{ability.can('update', 'Content') ? (
							<div className="mx-auto flex w-full items-center justify-center py-16">
								<Button asChild variant="secondary" className="gap-1">
									<Link href={`/workshops/new`}>
										<FilePlus2 className="h-4 w-4" /> New Workshop
									</Link>
								</Button>
							</div>
						) : null}
						{product && allowPurchase && (
							<section id="buy" className="mt-16">
								{!hasPurchased && (
									<h2 className="fluid-2xl mb-10 text-balance px-5 text-center font-bold">
										Get Access Today
									</h2>
								)}
								<div className="flex items-center justify-center border-y">
									<div className="bg-background flex w-full max-w-md flex-col border-x p-8">
										<PricingWidget
											quantityAvailable={-1}
											pricingDataLoader={pricingDataLoader}
											commerceProps={{ ...commerceProps }}
											product={product}
										/>
									</div>
								</div>
							</section>
						)}
					</div>
				</div>
			</main>
		</LayoutClient>
	)
}

async function WorkshopsList() {
	const products = await db.query.contentResourceProduct.findMany({
		with: {
			resource: {
				with: {
					resources: {
						with: {
							resource: true,
						},
						orderBy: asc(contentResourceResource.position),
					},
				},
			},
			product: true,
		},
		orderBy: asc(contentResourceProduct.position),
	})
	const cohorts = products.flatMap((product) => {
		return product.resource.resources
			.filter((resource) => resource.resource.type === 'workshop')
			.map((resource) => {
				return resource.resource
			})
	})
	const allWorkshops = await getAllWorkshops()
	let workshops = uniqBy(
		[...allWorkshops, ...cohorts],
		(item) => item.id,
	) as ContentResource[]
	const { ability } = await getServerAuthSession()

	const canEdit = ability.can('create', 'Content')
	if (canEdit) {
		const allWorkshops = await getAllWorkshops()
		workshops = allWorkshops
	}

	return (
		<ul className="mx-auto mt-8 flex w-full flex-col">
			{workshops.length === 0 && (
				<p className="p-5">There are no public workshops.</p>
			)}
			{workshops.map((workshop) => (
				<li key={workshop.id} className="flex">
					<Card className="divide-border bg-background -mt-px flex w-full flex-col items-center divide-y rounded-none border-x-0 shadow-none md:flex-row md:gap-3 md:divide-x md:divide-y-0">
						{/* {workshop?.fields?.coverImage?.url && (
							<Link
								className="relative flex items-center justify-center p-5 md:aspect-square md:w-1/4"
								href={`/workshops/${workshop.fields.slug || workshop.id}`}
								prefetch={true}
							>
								<Image
									className=" object-cover"
									fill
									// width={960 / 4}
									// height={540 / 4}
									src={workshop.fields.coverImage.url}
									alt={workshop.fields.coverImage?.alt || workshop.fields.title}
								/>
							</Link>
						)} */}
						<div className="flex h-full w-full flex-col justify-between p-5 md:pl-8">
							<div className="flex h-full flex-col pt-2 md:pt-5">
								<CardHeader className="p-0">
									<CardTitle className="fluid-xl font-semibold">
										<Link
											href={`/workshops/${workshop.fields?.slug || workshop.id}`}
											className="hover:text-primary w-full text-balance"
										>
											{workshop.fields?.title}
										</Link>
									</CardTitle>
								</CardHeader>
								{workshop.fields?.description && (
									<CardContent className="px-0 py-3">
										<p className="text-muted-foreground text-base font-normal">
											{workshop.fields?.description}
										</p>
									</CardContent>
								)}
							</div>
							<CardFooter className="flex items-center justify-between gap-3 px-0 pb-3 pt-5">
								<Contributor className="text-sm" />
								<div className="flex items-center gap-2">
									{ability.can('create', 'Content') && (
										<>
											<span className="text-sm">
												{workshop.fields?.visibility} {workshop.fields?.state}
											</span>
											<Button asChild variant="outline" size="sm">
												<Link
													href={`/workshops/${workshop.fields?.slug || workshop.id}/edit`}
												>
													Edit
												</Link>
											</Button>
										</>
									)}
								</div>
							</CardFooter>
						</div>
					</Card>
				</li>
			))}
		</ul>
	)
}
