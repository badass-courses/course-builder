import { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import { subscription as subscriptionTable } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'

import { Subscription } from '@coursebuilder/core/schemas/subscription'

export const metadata: Metadata = {
	title: 'Organization Billing',
	description: 'Manage organization billing and subscription',
}

export default async function BillingPage() {
	const { session, ability } = await getServerAuthSession()
	const headersList = await headers()
	const organizationId = headersList.get('x-organization-id')

	if (!organizationId || !session?.user?.id) {
		return redirect('/login')
	}

	if (
		!ability.can(
			'read',
			subject('OrganizationBilling', {
				organizationId,
			}),
		)
	) {
		throw new Error('Unauthorized')
	}

	const organization =
		await courseBuilderAdapter.getOrganization(organizationId)

	if (!organization) {
		throw new Error('Organization not found')
	}

	// Get organization subscription
	const activeSubscription = (await db.query.subscription.findFirst({
		where: (subscription, { eq, and }) =>
			and(
				eq(subscription.organizationId, organizationId),
				eq(subscription.status, 'active'),
			),
		with: {
			merchantSubscription: true,
		},
	})) as Subscription | null

	const stripeSubscription = activeSubscription?.merchantSubscription
		?.identifier
		? ((await stripeProvider.getSubscription(
				activeSubscription.merchantSubscription.identifier,
			)) as Stripe.Subscription)
		: null

	const currentPrice = stripeSubscription?.items.data[0]?.price
	const productName =
		typeof currentPrice?.product === 'string'
			? '' // Handle string case - could fetch product details if needed
			: // @ts-ignore
				currentPrice?.product?.name || 'Unknown Plan'
	const paymentMethod =
		stripeSubscription?.default_payment_method as Stripe.PaymentMethod

	if (activeSubscription && stripeSubscription) {
		if (stripeSubscription.status !== activeSubscription.status) {
			await db
				.update(subscriptionTable)
				.set({
					status: stripeSubscription.status,
					fields: {
						...activeSubscription.fields,
						stripeStatus: stripeSubscription.status,
						currentPeriodEnd: stripeSubscription.current_period_end,
						priceId: currentPrice?.id,
					},
				})
				.where(eq(subscriptionTable.id, activeSubscription.id))
		}
	}

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-4xl">
				<h1 className="mb-8 text-3xl font-bold">Billing & Subscription</h1>

				<div className="divide-y divide-gray-200 rounded-lg bg-white shadow-sm">
					{/* Current Plan */}
					<div className="p-6">
						<h2 className="text-lg font-medium text-gray-900">Current Plan</h2>
						<div className="mt-4">
							{stripeSubscription ? (
								<>
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-gray-500">Plan</p>
											<p className="text-lg font-medium text-gray-900">
												{productName}
											</p>
										</div>
										<button
											type="button"
											className="shadow-xs inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
										>
											Change Plan
										</button>
									</div>
									<div className="mt-4">
										<p className="text-sm font-medium text-gray-500">Status</p>
										<p className="text-lg font-medium text-gray-900">
											{stripeSubscription.status}
										</p>
									</div>
									<div className="mt-4">
										<p className="text-sm font-medium text-gray-500">
											Next Billing Date
										</p>
										<p className="text-lg font-medium text-gray-900">
											{new Date(
												stripeSubscription.current_period_end * 1000,
											).toLocaleDateString()}
										</p>
									</div>
									{currentPrice && (
										<div className="mt-4">
											<p className="text-sm font-medium text-gray-500">
												Amount
											</p>
											<p className="text-lg font-medium text-gray-900">
												${(currentPrice.unit_amount! / 100).toFixed(2)}/
												{currentPrice.recurring?.interval}
											</p>
										</div>
									)}
								</>
							) : (
								<div className="py-4 text-center">
									<p className="text-sm text-gray-500">
										No active subscription
									</p>
									<button
										type="button"
										className="shadow-xs mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
									>
										Subscribe Now
									</button>
								</div>
							)}
						</div>
					</div>

					{/* Payment Method */}
					{stripeSubscription && (
						<div className="p-6">
							<h2 className="text-lg font-medium text-gray-900">
								Payment Method
							</h2>
							<div className="mt-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center">
										<div className="text-sm text-gray-500">
											{paymentMethod?.card ? (
												<>
													<span className="font-medium">
														{paymentMethod.card.brand.toUpperCase()}
													</span>
													<span className="ml-2">
														•••• {paymentMethod.card.last4}
													</span>
													<span className="ml-2">
														Expires {paymentMethod.card.exp_month}/
														{paymentMethod.card.exp_year}
													</span>
												</>
											) : (
												'No payment method on file'
											)}
										</div>
									</div>
									<button
										type="button"
										className="shadow-xs inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
									>
										Update Payment Method
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Billing History */}
					<div className="p-6">
						<h2 className="text-lg font-medium text-gray-900">
							Billing History
						</h2>
						<div className="mt-4">
							{/* Billing history table would go here */}
							<p className="text-sm text-gray-500">
								No billing history available
							</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
