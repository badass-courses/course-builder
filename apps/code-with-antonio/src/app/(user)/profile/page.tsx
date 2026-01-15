import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { db } from '@/db'
import { users } from '@/db/schema'
import { env } from '@/env.mjs'
import { getUserActiveSubscription } from '@/lib/subscriptions'
import { getProviders, getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import { Button } from '@coursebuilder/ui'

import EditProfileForm from './_components/edit-profile-form'

export default async function ProfilePage() {
	const { session, ability } = await getServerAuthSession()
	const providers = getProviders()

	if (!ability.can('read', 'User', session?.user?.id)) {
		redirect('/')
	}

	if (!session) {
		return redirect('/')
	}

	if (!session.user) {
		notFound()
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		with: {
			accounts: true,
		},
	})

	if (!user) {
		notFound()
	}

	const discordProvider = providers?.discord
	const discordConnected = Boolean(
		user.accounts.find((account: any) => account.provider === 'discord'),
	)

	// Fetch user's active subscription
	const { subscription } = await getUserActiveSubscription(session.user.id)

	// Get Stripe subscription details if user has an active subscription
	let stripeSubscription = null
	let billingPortalUrl: string | null = null

	if (subscription?.merchantSubscription?.identifier) {
		try {
			stripeSubscription = await stripeProvider.getSubscription(
				subscription.merchantSubscription.identifier,
			)

			const customerId =
				typeof stripeSubscription.customer === 'string'
					? stripeSubscription.customer
					: stripeSubscription.customer.id

			billingPortalUrl = await stripeProvider.getBillingPortalUrl(
				customerId,
				`${env.COURSEBUILDER_URL}/profile`,
			)
		} catch (error) {
			// Subscription may have been deleted in Stripe, continue without it
			console.error('Failed to fetch Stripe subscription:', error)
		}
	}

	if (ability.can('read', 'User', session?.user?.id)) {
		return (
			<LayoutClient withContainer>
				<div className="max-w-(--breakpoint-lg) mx-auto flex min-h-[calc(100vh-var(--nav-height))] w-full flex-col items-start gap-8 px-5 py-20 sm:gap-10 sm:py-16 md:flex-row lg:gap-16">
					<header className="w-full md:max-w-[230px]">
						<h1 className="text-center text-xl font-bold md:text-left">
							Your Profile
						</h1>
					</header>
					<main className="flex w-full flex-col space-y-10 md:max-w-md">
						<EditProfileForm
							user={session.user}
							discordConnected={discordConnected}
							discordProvider={discordProvider}
						/>

						{stripeSubscription && subscription && (
							<SubscriptionDetails
								stripeSubscription={stripeSubscription}
								subscription={subscription}
								billingPortalUrl={billingPortalUrl}
							/>
						)}
					</main>
				</div>
			</LayoutClient>
		)
	}

	redirect('/')
}

/**
 * Formats a price amount in cents to a localized currency string.
 */
function formatPrice(amount: number | null, currency: string): string {
	if (!amount) return 'N/A'
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency.toUpperCase(),
	}).format(amount / 100)
}

/**
 * Formats the subscription billing interval for display.
 */
function formatSubscriptionInterval(interval: string): string {
	return interval === 'month' ? 'Monthly' : 'Yearly'
}

/**
 * Displays subscription details including status, billing info, and manage button.
 */
function SubscriptionDetails({
	stripeSubscription,
	subscription,
	billingPortalUrl,
}: {
	stripeSubscription: import('stripe').Stripe.Subscription
	subscription: import('@coursebuilder/core/schemas/subscription').Subscription
	billingPortalUrl: string | null
}) {
	const priceItem = stripeSubscription.items.data[0]?.price
	const quantity = stripeSubscription.items.data[0]?.quantity || 1
	const interval = priceItem?.recurring?.interval || 'month'
	const unitAmount = priceItem?.unit_amount ?? 0
	const currency = priceItem?.currency || 'usd'

	return (
		<section className="border-border space-y-4 border-t pt-10">
			<h2 className="text-lg font-bold">Subscription</h2>

			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col">
					<span className="text-muted-foreground text-sm">Status</span>
					<span className="capitalize">{stripeSubscription.status}</span>
				</div>

				<div className="flex flex-col">
					<span className="text-muted-foreground text-sm">Billing</span>
					<span>
						{formatSubscriptionInterval(interval)} -{' '}
						{formatPrice(unitAmount * quantity, currency)}
					</span>
				</div>

				<div className="flex flex-col">
					<span className="text-muted-foreground text-sm">Next Payment</span>
					<span>
						{new Date(
							stripeSubscription.current_period_end * 1000,
						).toLocaleDateString()}
					</span>
				</div>

				{quantity > 1 && (
					<div className="flex flex-col">
						<span className="text-muted-foreground text-sm">Seats</span>
						<span>{quantity}</span>
					</div>
				)}
			</div>

			{stripeSubscription.cancel_at_period_end && (
				<div className="bg-warning/10 text-warning-foreground rounded-md p-3 text-sm">
					Your subscription will cancel at the end of the current billing
					period.
				</div>
			)}

			{billingPortalUrl && (
				<div className="pt-2">
					<Button asChild variant="outline">
						<Link href={billingPortalUrl}>Manage Billing</Link>
					</Button>
				</div>
			)}
		</section>
	)
}
