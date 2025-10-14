'use client'

import * as React from 'react'
import Link from 'next/link'
import {
	useParams,
	// useSearchParams
} from 'next/navigation'
import { api } from '@/trpc/react'
import cookieUtil from '@/utils/cookies'
import { isBefore, subDays } from 'date-fns'
import Countdown, { type CountdownRenderProps } from 'react-countdown'

import { useToast } from '@coursebuilder/ui'
import { ToastAction } from '@coursebuilder/ui/primitives/toast'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export const useSaleToastNotifier = () => {
	const DAYS_TO_WAIT_BETWEEN_SHOWING_DISMISSED_PROMOTION = 2
	const { toast } = useToast()
	const { data: defaultCoupon, status } = api.pricing.defaultCoupon.useQuery()
	const params = useParams()
	// const searchParams = useSearchParams()
	const allowPurchase = defaultCoupon?.product?.fields?.visibility === 'public'
	const promoCookieName = `promo_${defaultCoupon?.id}`
	const couponCookie = defaultCoupon && cookieUtil.get(promoCookieName)
	const lastDismissed = couponCookie?.dismissed_on
	const thresholdDays = subDays(
		new Date(),
		DAYS_TO_WAIT_BETWEEN_SHOWING_DISMISSED_PROMOTION,
	)
	const dismissedButThresholdExceeded = lastDismissed
		? isBefore(new Date(lastDismissed), thresholdDays)
		: true

	const productResourceSlug =
		defaultCoupon?.product?.resources[0]?.resource?.fields?.slug
	const productResourceType =
		defaultCoupon?.product?.resources[0]?.resource?.type

	const productPath =
		productResourceType && productResourceSlug
			? getResourcePath(productResourceType, productResourceSlug)
			: null

	const param = params.slug || params.module

	React.useEffect(() => {
		if (
			defaultCoupon &&
			dismissedButThresholdExceeded &&
			allowPurchase &&
			(defaultCoupon?.expires
				? new Date(defaultCoupon?.expires) > new Date()
				: true) &&
			productResourceSlug !== param
		) {
			toast({
				title: `Save ${Number(defaultCoupon?.percentageDiscount) * 100}% on ${defaultCoupon?.product?.name}`,
				duration: Infinity,
				onDismiss: () => {
					cookieUtil.set(
						promoCookieName,
						{
							dismissed_on: new Date(),
						},
						{
							expires: defaultCoupon.expires,
						},
					)
				},
				description: (
					<>
						{defaultCoupon?.expires && (
							<Countdown
								date={defaultCoupon.expires}
								renderer={({ days, hours, minutes, seconds, completed }) => {
									if (completed) {
										return 'Sale has ended'
									}
									return (
										<div>
											Hurry! Offer ends in{' '}
											<span className="tabular-nums">
												{days > 0 && `${days} days,`}{' '}
												{hours > 0 && `${hours} hours,`}{' '}
												{minutes > 0 && `${minutes} minutes, and`} {seconds}{' '}
												seconds
											</span>
										</div>
									)
								}}
							/>
						)}
					</>
				),
				action: productPath ? (
					<ToastAction
						altText="Buy Now"
						asChild
						className="bg-primary hover:bg-primary/90 text-primary-foreground"
					>
						<Link href={productPath}>Buy Now</Link>
					</ToastAction>
				) : null,
			})
		}
	}, [
		defaultCoupon,
		allowPurchase,
		params.slug,
		dismissedButThresholdExceeded,
		toast,
	])
}
