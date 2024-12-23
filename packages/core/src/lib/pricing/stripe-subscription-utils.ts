import { first } from 'lodash'
import type Stripe from 'stripe'

import {
	CheckoutSessionMetadata,
	CheckoutSessionMetadataSchema,
} from '../../schemas/stripe/checkout-session-metadata'
import {
	SubscriptionInfo,
	SubscriptionInfoSchema,
} from '../../schemas/subscription-info'
import { logger } from '../utils/logger'

export async function parseSubscriptionInfoFromCheckoutSession(
	checkoutSession: Stripe.Checkout.Session,
) {
	logger.debug('Parsing subscription info from checkout session', {
		checkoutSession,
	})

	const { customer, subscription, metadata } = checkoutSession
	const { email, name, id: stripeCustomerId } = customer as Stripe.Customer
	const stripeSubscription = subscription as Stripe.Subscription

	const subscriptionItem = first(stripeSubscription.items.data)
	if (!subscriptionItem) {
		logger.error(new Error('No subscription item found in checkout session'))
		throw new Error('No subscription item found')
	}

	const stripePrice = subscriptionItem.price
	const quantity = subscriptionItem.quantity || 1
	const stripeProduct = (stripeSubscription as any).plan
		?.product as Stripe.Product

	logger.debug('Found subscription details', {
		stripeCustomerId,
		subscriptionId: stripeSubscription.id,
		productId: stripeProduct.id,
		quantity,
	})

	// Add required fields to metadata before parsing
	const enrichedMetadata = {
		bulk: quantity > 1 ? 'true' : 'false',
		country: 'US',
		ip_address: '127.0.0.1',
		productId: stripeProduct.id,
		product: stripeProduct.name,
		siteName: 'default',
		...metadata,
	}

	const parsedMetadata = enrichedMetadata
		? CheckoutSessionMetadataSchema.parse(enrichedMetadata)
		: undefined

	logger.debug('Enriched metadata', { enrichedMetadata, parsedMetadata })

	const info: SubscriptionInfo = {
		customerIdentifier: stripeCustomerId,
		email,
		name,
		productIdentifier: stripeProduct.id,
		product: stripeProduct,
		subscriptionIdentifier: stripeSubscription.id,
		priceIdentifier: stripePrice.id,
		quantity,
		status: stripeSubscription.status,
		currentPeriodStart: new Date(
			stripeSubscription.current_period_start * 1000,
		),
		currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
		metadata: parsedMetadata,
	}

	const parsedInfo = SubscriptionInfoSchema.parse(info)
	logger.debug('Successfully parsed subscription info', { parsedInfo })
	return parsedInfo
}

export interface SubscriptionPermissions {
	organizationId: string
	purchasingMemberId: string
	isMultiUser: boolean
	assignToMember?: string // only for single-user subscriptions
}

export function determineSubscriptionPermissions(
	metadata: CheckoutSessionMetadata,
	organizationId: string,
	purchasingMemberId: string,
): SubscriptionPermissions {
	logger.debug('Determining subscription permissions', {
		metadata,
		organizationId,
		purchasingMemberId,
	})

	const isMultiUser = metadata.bulk === 'true'

	const permissions = {
		organizationId,
		purchasingMemberId,
		isMultiUser,
		assignToMember: !isMultiUser ? purchasingMemberId : undefined,
	}

	logger.debug('Determined subscription permissions', { permissions })
	return permissions
}
