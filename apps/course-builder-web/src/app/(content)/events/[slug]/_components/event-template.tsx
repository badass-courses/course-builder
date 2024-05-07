'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { env } from '@/env.mjs'
import { EventDetails } from '@/pricing/event-details'
import Balancer from 'react-wrap-balancer'

import {
	PriceCheckProvider,
	PricingWidget,
} from '@coursebuilder/commerce-next/pricing'

import { EventPageProps } from './event-page-props'

export async function EventTemplate(props: EventPageProps) {
	const path = usePathname()
	const {
		event,
		mdx,
		products,
		quantityAvailable,
		purchaseCount,
		totalQuantity,
		pricingDataLoader,
		...commerceProps
	} = props
	const { fields, createdAt, updatedAt } = event
	const { title, body, startsAt, endsAt, slug, timezone, description } = fields

	const product = products && products[0]
	const pageDescription = description
	const hostName = 'Your Instructor'
	const url = `${env.NEXT_PUBLIC_URL}/${path}`

	const purchasedProductIds =
		commerceProps?.purchases?.map((purchase) => purchase.productId) || []
	const hasPurchase = purchasedProductIds.length > 0

	const isUpcoming = startsAt
		? new Date(startsAt) > new Date()
		: startsAt
			? new Date(startsAt) > new Date()
			: false

	return (
		<Layout>
			<main
				data-event={slug}
				className="mx-auto flex w-full max-w-screen-lg flex-col gap-8 px-5 py-5 md:flex-row md:py-16"
			>
				<div className="w-full">
					<h1 className="fluid-3xl w-full font-semibold tracking-tight">
						<Balancer>{title}</Balancer>
					</h1>

					<hr className="bg-border my-10 flex h-px w-full" />
					<article className="invert-svg prose dark:prose-invert md:prose-xl prose-code:break-words md:prose-code:break-normal mx-auto w-full max-w-none"></article>
				</div>
				<aside className="relative mx-auto w-full max-w-xs">
					<div className="shadow-soft-xl dark:bg-foreground/5 flex w-full flex-col items-center rounded-xl bg-white pb-5">
						{product && product.status === 1 && isUpcoming && (
							<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
								<PricingWidget
									commerceProps={{ ...commerceProps, products }}
									product={product}
									quantityAvailable={quantityAvailable}
									pricingDataLoader={pricingDataLoader}
								/>
							</PriceCheckProvider>
						)}
						<EventDetails event={event} />
					</div>
				</aside>
			</main>
		</Layout>
	)
}
