'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TeamPageData } from '@/app/(user)/team/page'
import { CldImage } from '@/components/cld-image'

import { BuyMoreSeats } from '@coursebuilder/commerce-next/post-purchase/buy-more-seats'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { ClaimedTeamSeats } from '@coursebuilder/commerce-next/team/claimed-team-seats'
import InviteTeam from '@coursebuilder/commerce-next/team/invite-team'
import { Card } from '@coursebuilder/ui'

export function TeamPageTemplate({ bulkPurchases, user }: TeamPageData) {
	const router = useRouter()

	if (!bulkPurchases) return <h1>No Team Found</h1>

	return (
		<div className="max-w-(--breakpoint-lg) mx-auto flex w-full flex-col items-start gap-8 px-5 py-20 sm:gap-10 sm:py-16 md:flex-row lg:gap-16">
			<header className="w-full md:max-w-[230px]">
				<h1 className="text-center text-xl font-bold md:text-left">
					Your Team
				</h1>
			</header>
			<main className="divide-stroke flex w-full flex-col gap-5 divide-y md:max-w-lg">
				{user &&
					bulkPurchases &&
					bulkPurchases.map((purchase) => {
						const { bulkPurchase, pricingDataLoader } = purchase
						if (!bulkPurchase?.purchase)
							return <div key={purchase.bulkCoupon}>No bulk purchase found</div>

						const existingPurchase = bulkPurchase?.existingPurchase
						const bulkCoupon = purchase.bulkCoupon

						const redemptionsLeft =
							bulkCoupon &&
							bulkCoupon.maxUses > bulkCoupon.usedCount &&
							bulkCoupon.status === 1 // Check if coupon is active

						return (
							<div
								key={bulkPurchase.purchase.id}
								className="bg-card flex w-full flex-col gap-5 rounded border p-5"
							>
								<div className="flex flex-col gap-5">
									<div className="flex flex-col items-center gap-4 sm:flex-row">
										{bulkPurchase?.purchase?.product?.fields.image?.url && (
											<CldImage
												width={100}
												height={100}
												src={bulkPurchase?.purchase?.product?.fields.image?.url}
												alt={bulkPurchase?.purchase?.product?.name || ''}
											/>
										)}
										<h2 className="text-lg font-semibold">
											Invite your team to{' '}
											{bulkPurchase?.purchase?.product?.name}
										</h2>
									</div>
									<InviteTeam
										disabled={!redemptionsLeft}
										purchase={bulkPurchase.purchase}
										existingPurchase={existingPurchase}
										userEmail={user.email}
										className="flex flex-col items-start gap-y-2"
									/>
								</div>
								{purchase && (
									<ClaimedTeamSeats
										purchase={bulkPurchase.purchase}
										bulkCoupon={bulkCoupon}
									/>
								)}
								{user && bulkPurchase?.purchase?.product?.id && (
									<Pricing.Root
										className="relative w-full"
										product={bulkPurchase?.purchase?.product}
										couponId={bulkPurchase?.purchase?.couponId}
										userId={user.id}
										pricingDataLoader={pricingDataLoader}
									>
										<Pricing.Product className="flex w-full flex-col gap-2">
											<Pricing.BuyMoreSeats className="pt-5">
												<Pricing.TeamQuantityInput
													className="mb-0"
													label="Quantity"
												/>
												<Pricing.Price className="scale-75" />
												<Pricing.BuyButton>
													Buy Additional Seats
												</Pricing.BuyButton>
											</Pricing.BuyMoreSeats>
											<Pricing.BuyMoreSeatsToggle className="text-primary h-10 w-full px-5 py-3 text-sm" />
										</Pricing.Product>
									</Pricing.Root>
								)}
							</div>
						)
					})}
			</main>
		</div>
	)
}
