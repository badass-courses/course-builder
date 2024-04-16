import { add } from 'date-fns'
import { first, isEmpty } from 'lodash'
import { CourseBuilderAdapter } from 'src/adapters'
import Stripe from 'stripe'
import { z } from 'zod'

import {
	StripeProviderConfig,
	StripeProviderConsumerConfig,
} from '../../providers/stripe'
import { Product, Purchase, UpgradableProduct } from '../../schemas'
import { getFixedDiscountForIndividualUpgrade } from './format-prices-for-product'
import { getCalculatedPrice } from './get-calculated-price'

export const CheckoutParamsSchema = z.object({
	ip_address: z.string().optional(),
	productId: z.string(),
	quantity: z.coerce
		.number()
		.optional()
		.transform((val) => Number(val) || 0),
	country: z.string().optional(),
	couponId: z.string().optional(),
	userId: z.string().optional(),
	upgradeFromPurchaseId: z.string().optional(),
	bulk: z.coerce.boolean().transform((val) => Boolean(val) || false),
	cancelUrl: z.string(),
	usedCouponId: z.string().optional(),
})

export type CheckoutParams = z.infer<typeof CheckoutParamsSchema>

const buildSearchParams = (params: object) => {
	// implementing this instead of using `URLSearchParams` because that API
	// does URL encoding of values in the URL like the curly braces in
	// `session_id={CHECKOUT_SESSION_ID}` which needs to get passed to stripe
	// as is.
	if (isEmpty(params)) {
		return ''
	} else {
		return Object.entries(params)
			.map(([key, value]) => {
				return `${key}=${value}`
			})
			.join('&')
	}
}

/**
 * Given a specific user we want to lookup their Stripe
 * customer ID and if one doesn't exist we will
 * create it.
 * @param userId
 */
async function findOrCreateStripeCustomerId(
	userId: string,
	stripe: Stripe,
	adapter: CourseBuilderAdapter,
) {
	const user = await adapter.getUser?.(userId)

	if (user) {
		const merchantCustomer = await adapter.getMerchantCustomerForUserId(user.id)
		const customerId =
			user && merchantCustomer ? merchantCustomer.identifier : false

		if (customerId) {
			return customerId
		} else {
			const merchantAccount = await adapter.getMerchantAccount({
				provider: 'stripe',
			})
			if (merchantAccount) {
				const customer = await stripe.customers.create({
					email: user.email,
					metadata: {
						userId: user.id,
					},
				})
				await adapter.createMerchantCustomer({
					identifier: customer.id,
					merchantAccountId: merchantAccount.id,
					userId,
				})
				return customer.id
			}
		}
	}
	return false
}

export class CheckoutError extends Error {
	couponId?: string
	productId: string

	constructor(message: string, productId: string, couponId?: string) {
		super(message)
		this.name = 'CheckoutError'
		this.couponId = couponId
		this.productId = productId
	}
}

const buildCouponNameWithProductName = (
	pre: string,
	productName: string,
	post: string,
): string => {
	// Calculate the total length without the ellipsis
	const totalLength = pre.length + productName.length + post.length

	// If total length exceeds 40 characters
	if (totalLength > 40) {
		// Calculate the number of characters to truncate from productName
		const excess = totalLength - 40 + 3 // 3 is for the length of ellipsis "..."
		productName = productName.slice(0, -excess) + '...'
	}

	// Return the concatenated string
	return pre + productName + post
}

const buildCouponName = (
	upgradeFromPurchase:
		| (Purchase & {
				product: Product | null
		  })
		| null,
	productId: string,
	availableUpgrade: UpgradableProduct | null | undefined,
	purchaseWillBeRestricted: boolean,
	stripeCouponPercentOff: number,
) => {
	let couponName = null

	if (
		upgradeFromPurchase?.status === 'Restricted' &&
		!purchaseWillBeRestricted &&
		upgradeFromPurchase.productId === productId
	) {
		// if its the same productId and we are going from PPP to Unrestricted
		couponName = 'Unrestricted'
	} else if (availableUpgrade && upgradeFromPurchase?.status === 'Valid') {
		// if there is an availableUpgrade (e.g. Core -> Bundle) and the original purchase wasn't region restricted
		couponName = buildCouponNameWithProductName(
			'Upgrade from ',
			upgradeFromPurchase.product?.name || '',
			'',
		)
	} else if (
		availableUpgrade &&
		upgradeFromPurchase?.status === 'Restricted' &&
		purchaseWillBeRestricted
	) {
		// if there is an availableUpgrade (e.g. Core -> Bundle) and we are staying PPP
		// betterCouponName = `Upgrade from ${
		//   upgradeFromPurchase.product.name
		// } + PPP ${stripeCouponPercentOff * 100}% off`
		couponName = buildCouponNameWithProductName(
			'Upgrade from ',
			upgradeFromPurchase.product?.name || '',
			` + PPP ${Math.floor(stripeCouponPercentOff * 100)}% off`,
		)
	} else if (
		availableUpgrade &&
		upgradeFromPurchase?.status === 'Restricted' &&
		!purchaseWillBeRestricted
	) {
		// if there is an availableUpgrade (e.g. Core -> Bundle) and we are going from PPP to Unrestricted
		// couponName = `Unrestricted Upgrade from ${upgradeFromPurchase.product.name}`
		couponName = buildCouponNameWithProductName(
			'Unrestricted Upgrade from ',
			upgradeFromPurchase.product?.name || '',
			'',
		)
	} else {
		// we don't expect to hit this case
		couponName = 'Discount'
	}

	return couponName
}

const LoadedProductSchema = z.object({
	id: z.string(),
})

export async function stripeCheckout({
	params,
	config,
	adapter,
}: {
	params: CheckoutParams
	config: StripeProviderConsumerConfig
	adapter?: CourseBuilderAdapter
}): Promise<any> {
	try {
		if (!adapter) {
			throw new Error('Adapter is required')
		}

		const ip_address = params.ip_address

		let errorRedirectUrl: string | undefined = undefined

		const stripe = new Stripe(config.apiKey, {
			apiVersion: '2020-08-27',
		})

		if (!stripe) {
			throw new Error('Stripe client is missing')
		}

		try {
			const {
				productId,
				quantity: queryQuantity = 1,
				couponId,
				userId,
				upgradeFromPurchaseId,
				bulk = false,
				usedCouponId,
			} = params

			console.log('lets build a product checkout link', { productId })

			errorRedirectUrl = config.errorRedirectUrl
			const cancelUrl = config.cancelUrl

			const quantity = Number(queryQuantity)

			console.log({ quantity })

			const user = userId ? await adapter.getUser?.(userId as string) : false

			const upgradeFromPurchase = upgradeFromPurchaseId
				? await adapter.getPurchase(upgradeFromPurchaseId)
				: null

			console.log({ upgradeFromPurchase })

			const availableUpgrade =
				quantity === 1 && upgradeFromPurchase
					? await adapter.getUpgradableProducts({
							upgradableFromId: upgradeFromPurchase.productId,
							upgradableToId: productId as string,
						})
					: null

			console.log({ availableUpgrade })

			const customerId = user
				? await findOrCreateStripeCustomerId(user.id, stripe, adapter)
				: false

			console.log({ customerId })

			const loadedProduct = await adapter.getProduct(productId)

			console.log({ loadedProduct })

			const result = LoadedProductSchema.safeParse(loadedProduct)

			if (!result.success) {
				const errorMessages = result.error.errors
					.map((err) => err.message)
					.join(', ')

				// Send `errorMessages` to Sentry so we can deal with it right away.
				console.log(`No product (${productId}) was found (${errorMessages})`)

				throw new CheckoutError(
					`No product was found`,
					String(loadedProduct?.id),
					couponId as string,
				)
			}

			const loadedProductData = result.data

			const merchantProduct = await adapter.getMerchantProductForProductId(
				loadedProductData.id,
			)

			console.log({ merchantProduct })

			const merchantProductIdentifier = merchantProduct?.identifier

			if (!merchantProduct) {
				throw new Error('No merchant product found')
			}

			const merchantPrice = await adapter.getMerchantPriceForProductId(
				merchantProduct.id,
			)

			console.log({ merchantPrice })

			const merchantPriceIdentifier = merchantPrice?.identifier

			if (!merchantPriceIdentifier || !merchantProductIdentifier) {
				throw new Error('No merchant price or product found')
			}

			const merchantCoupon = couponId
				? await adapter.getMerchantCoupon(couponId as string)
				: null

			console.log({ merchantCoupon })

			const stripeCoupon =
				merchantCoupon && merchantCoupon.identifier
					? await stripe.coupons.retrieve(merchantCoupon.identifier)
					: false

			const stripeCouponPercentOff =
				stripeCoupon && stripeCoupon.percent_off
					? stripeCoupon.percent_off / 100
					: 0

			let discounts = []
			let appliedPPPStripeCouponId: string | undefined | null = undefined
			let upgradedFromPurchaseId: string | undefined | null = undefined

			const isUpgrade = Boolean(
				(availableUpgrade || upgradeFromPurchase?.status === 'Restricted') &&
					upgradeFromPurchase,
			)

			const TWELVE_FOUR_HOURS_FROM_NOW = Math.floor(
				add(new Date(), { hours: 12 }).getTime() / 1000,
			)

			if (isUpgrade && upgradeFromPurchase && loadedProduct && customerId) {
				const purchaseWillBeRestricted = merchantCoupon?.type === 'ppp'
				appliedPPPStripeCouponId = merchantCoupon?.identifier
				upgradedFromPurchaseId = upgradeFromPurchase.id

				const fixedDiscountForIndividualUpgrade =
					await getFixedDiscountForIndividualUpgrade({
						purchaseToBeUpgraded: upgradeFromPurchase,
						productToBePurchased: loadedProduct,
						purchaseWillBeRestricted,
						userId,
						ctx: adapter,
					})

				const productPrice = await adapter.getPriceForProduct(loadedProduct.id)

				console.log({ productPrice })

				const fullPrice = productPrice?.unitAmount || 0
				const calculatedPrice = getCalculatedPrice({
					unitPrice: fullPrice,
					percentOfDiscount: stripeCouponPercentOff || 0,
					quantity: 1,
					fixedDiscount: fixedDiscountForIndividualUpgrade,
				})

				console.log({ calculatedPrice })

				const upgradeFromProduct = await adapter.getProduct(
					upgradeFromPurchase.productId,
				)

				console.log({ upgradeFromProduct })

				if (fixedDiscountForIndividualUpgrade > 0) {
					const couponName = buildCouponName(
						{ ...upgradeFromPurchase, product: upgradeFromProduct },
						productId,
						first(availableUpgrade),
						purchaseWillBeRestricted,
						stripeCouponPercentOff,
					)

					const amount_off_in_cents = (fullPrice - calculatedPrice) * 100

					const coupon = await stripe.coupons.create({
						amount_off: amount_off_in_cents,
						name: couponName,
						max_redemptions: 1,
						redeem_by: TWELVE_FOUR_HOURS_FROM_NOW,
						currency: 'USD',
						applies_to: {
							products: [merchantProductIdentifier],
						},
					})

					discounts.push({
						coupon: coupon.id,
					})
				}
			} else if (merchantCoupon && merchantCoupon.identifier) {
				// no ppp for bulk purchases
				const isNotPPP = merchantCoupon.type !== 'ppp'
				if (isNotPPP || quantity === 1) {
					appliedPPPStripeCouponId =
						merchantCoupon.type === 'ppp'
							? merchantCoupon?.identifier
							: undefined
					const { id } = await stripe.promotionCodes.create({
						coupon: merchantCoupon.identifier,
						max_redemptions: 1,
						expires_at: TWELVE_FOUR_HOURS_FROM_NOW,
					})
					discounts.push({
						promotion_code: id,
					})
				}
			}

			if (!loadedProduct) {
				throw new Error('No product was found')
			}

			let successUrl: string = (() => {
				const baseQueryParams = {
					session_id: '{CHECKOUT_SESSION_ID}',
					provider: 'stripe',
				}

				if (isUpgrade) {
					const queryParamString = buildSearchParams({
						...baseQueryParams,
						upgrade: 'true',
					})
					return `${config.baseSuccessUrl}/welcome?${queryParamString}`
				} else {
					const queryParamString = buildSearchParams(baseQueryParams)

					return `${config.baseSuccessUrl}/thanks/purchase?${queryParamString}`
				}
			})()

			console.log({ successUrl: successUrl })

			const metadata = {
				...(Boolean(availableUpgrade && upgradeFromPurchase) && {
					upgradeFromPurchaseId: upgradeFromPurchaseId as string,
				}),
				bulk: Boolean(bulk) ? 'true' : quantity > 1 ? 'true' : 'false',
				...(appliedPPPStripeCouponId && { appliedPPPStripeCouponId }),
				...(upgradedFromPurchaseId && { upgradedFromPurchaseId }),
				country: params.country || process.env.DEFAULT_COUNTRY || 'US',
				ip_address: params.ip_address || '',
				...(usedCouponId && { usedCouponId }),
				productId: loadedProduct.id,
				product: loadedProduct.name,
				...(user && { userId: user.id }),
				siteName: process.env.NEXT_PUBLIC_APP_NAME as string,
			}

			const session = await stripe.checkout.sessions.create({
				discounts,
				line_items: [
					{
						price: merchantPriceIdentifier,
						quantity: Number(quantity),
					},
				],
				expires_at: TWELVE_FOUR_HOURS_FROM_NOW,
				mode: 'payment',
				success_url: successUrl,
				cancel_url: cancelUrl,
				...(customerId && { customer: customerId }),
				metadata,
				payment_intent_data: {
					metadata,
				},
			})

			console.log({ session })

			if (session.url) {
				console.log()
				console.log()
				console.log()
				console.log({ sessionUrl: session.url })
				console.log()
				console.log()
				console.log()
				return {
					redirect: session.url,
					status: 303,
				}
			} else {
				throw new CheckoutError(
					'no-stripe-session',
					loadedProduct.id,
					couponId as string,
				)
			}
		} catch (err: any) {
			console.log()
			console.log()
			console.log()
			console.log({ err: JSON.stringify(err) })
			console.log()
			console.log()
			console.log()
			if (errorRedirectUrl) {
				return {
					redirect: errorRedirectUrl,
					status: 303,
				}
			}

			return {
				status: 500,
				body: { error: true, message: err.message },
			}
		}
	} catch (error: any) {
		return {
			status: 500,
			body: { error: true, message: error.message },
		}
	}
}
