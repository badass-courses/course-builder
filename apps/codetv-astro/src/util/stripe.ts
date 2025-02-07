import type { User } from '@clerk/astro/server'
import {
	STRIPE_SECRET_KEY,
	STRIPE_WEBHOOK_SECRET,
	TIER_GOLD_PRICE_ID,
	TIER_PLATINUM_PRICE_ID,
	TIER_SILVER_PRICE_ID,
} from 'astro:env/server'
import Stripe from 'stripe'

export const stripe = new Stripe(STRIPE_SECRET_KEY)

export const STRIPE_SUBSCRIPTION_TYPES = [
	{
		name: 'Silver',
		description:
			'Get early access to new episodes, and directly fund the creation of new content.',
		prices: [
			{
				period: 'monthly',
				price: 5_00,
				priceId: TIER_SILVER_PRICE_ID,
			},
		],
	},
	{
		name: 'Gold',
		description:
			'All the perks of the silver tier + a 20% discount on courses and workshops.',
		prices: [
			{
				period: 'monthly',
				price: 20_00,
				priceId: TIER_GOLD_PRICE_ID,
			},
		],
	},
	{
		name: 'Platinum',
		description:
			'All the perks of the gold tier + the option to book a 30-minute monthly strategy call.',
		prices: [
			{
				period: 'monthly',
				price: 100_00,
				priceId: TIER_PLATINUM_PRICE_ID,
			},
		],
	},
]

export async function validateWebhookSignature(request: Request) {
	const signature = request.headers.get('stripe-signature')

	if (!signature) {
		return new Response(null, {
			status: 400,
		})
	}

	let event
	try {
		event = stripe.webhooks.constructEvent(
			await request.text(),
			signature,
			STRIPE_WEBHOOK_SECRET,
		)
	} catch (error) {
		if (error instanceof Error) {
			return new Response(
				JSON.stringify({
					error: error.message,
				}),
				{
					status: 400,
				},
			)
		}
	}

	if (!event) {
		return new Response(null, {
			status: 400,
		})
	}

	return event
}

export async function getSubscriptionStatus(user: User | null) {
	if (
		!user ||
		!user.publicMetadata.stripe ||
		!user.publicMetadata.stripe.status
	) {
		return null
	}

	return user.publicMetadata.stripe.status
}

export async function getSubscriptionDetails(user: User | null) {
	if (
		!user ||
		!user.publicMetadata.stripe ||
		!user.publicMetadata.stripe.customer
	) {
		return null
	}

	const subList = await stripe.subscriptions.list({
		customer: user.publicMetadata.stripe.customer,
	})

	return subList.data.at(0)
}
