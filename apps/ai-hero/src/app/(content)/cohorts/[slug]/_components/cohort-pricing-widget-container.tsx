'use client'

import * as React from 'react'
import { PricingWidget } from '@/app/(content)/workshops/_components/pricing-widget'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { track } from '@/utils/analytics'
import { formatInTimeZone } from 'date-fns-tz'
import { toSnakeCase } from 'drizzle-orm/casing'
import { CheckCircle } from 'lucide-react'

import type { CohortPageProps } from './cohort-page-props'

export const CohortPricingWidgetContainer: React.FC<CohortPageProps> = (
	props,
) => {
	const {
		cohort,
		mdx,
		products,
		quantityAvailable,
		purchaseCount,
		totalQuantity,
		pricingDataLoader,
		hasPurchasedCurrentProduct,
		...commerceProps
	} = props
	const { fields } = cohort
	const { startsAt, timezone } = fields
	const product = products && products[0]

	// Properly handle timezone comparison - get current time in PT to compare with PT stored date
	const tz = timezone || 'America/Los_Angeles'
	const nowInPT = new Date(
		formatInTimeZone(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
	)
	const isUpcoming = startsAt ? new Date(startsAt) > nowInPT : false

	const workshops = cohort?.resources?.map(({ resource }) => ({
		title: resource.fields.title,
		slug: resource.fields.slug,
	}))
	const waitlistCkFields = {
		// example: waitlist_mcp_workshop_ticket: "2025-04-17"
		[`waitlist_${toSnakeCase(product?.name || '')}`]: new Date()
			.toISOString()
			.slice(0, 10),
	}
	return (
		<>
			{product && product.status === 1 && isUpcoming && (
				<div className="border-b px-5 pb-5">
					<PricingWidget
						className="border-b-0"
						workshops={workshops}
						product={product}
						quantityAvailable={quantityAvailable}
						commerceProps={commerceProps}
						pricingDataLoader={pricingDataLoader}
						pricingWidgetOptions={{
							isCohort: true,
							isLiveEvent: false,
							withImage: false,
							withTitle: false,
						}}
					/>
				</div>
			)}
			{!isUpcoming && product && product.status === 1 && (
				<div className="p-5">
					<div className="flex flex-col items-center justify-center gap-2 text-center">
						<p className="text-lg font-semibold">
							This cohort has already started
						</p>
						<p className="text-foreground/80 text-balance text-sm">
							You can still join the waitlist to be notified when the next
							cohort starts.
						</p>
					</div>
					<SubscribeToConvertkitForm
						fields={waitlistCkFields}
						actionLabel="Join Waitlist"
						className="w-ful relative z-10 mt-5 flex flex-col items-center justify-center gap-2 [&_button]:mt-1 [&_button]:h-12 [&_button]:w-full [&_button]:text-base [&_input]:h-12 [&_input]:text-lg"
						successMessage={
							<p className="inline-flex items-center text-center text-lg font-medium">
								<CheckCircle className="text-primary mr-2 size-5" /> You are on
								the waitlist
							</p>
						}
						onSuccess={(subscriber, email) => {
							const handleOnSuccess = (subscriber: any) => {
								if (subscriber) {
									track('waitlist_joined', {
										product_name: product.name,
										product_id: product.id,
										email: email,
									})

									return subscriber
								}
							}
							handleOnSuccess(subscriber)
						}}
					/>
				</div>
			)}
		</>
	)
}
