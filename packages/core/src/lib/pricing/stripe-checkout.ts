import { add } from 'date-fns'
import { CourseBuilderAdapter } from 'src/adapters'
import { CheckoutSessionMetadataSchema } from 'src/schemas/stripe/checkout-session-metadata'
import Stripe from 'stripe'
import { z } from 'zod'

import { first, isEmpty } from '@coursebuilder/nodash'

import { Product, Purchase, UpgradableProduct } from '../../schemas'
import { PaymentsAdapter, PaymentsProviderConsumerConfig } from '../../types'
import {
	formatPricesForProduct,
	getFixedDiscountForIndividualUpgrade,
} from './format-prices-for-product'
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
	bulk: z.preprocess((val) => {
		return val === 'false' ? false : Boolean(val)
	}, z.coerce.boolean()),
	cancelUrl: z.string(),
	usedCouponId: z.string().optional(),
	organizationId: z.string().optional(),
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
 * @param adapter
 * @param paymentsAdapter
 */
async function findOrCreateStripeCustomerId(
	userId: string,
	adapter: CourseBuilderAdapter,
	paymentsAdapter: PaymentsAdapter,
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
				const customerId = await paymentsAdapter.createCustomer({
					email: user.email,
					metadata: {
						userId: user.id,
					},
				})
				await adapter.createMerchantCustomer({
					identifier: customerId,
					merchantAccountId: merchantAccount.id,
					userId,
				})
				return customerId
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
	config: PaymentsProviderConsumerConfig
	adapter?: CourseBuilderAdapter
}): Promise<any> {
	try {
		if (!adapter) {
			throw new Error('Adapter is required')
		}

		const ip_address = params.ip_address

		let errorRedirectUrl: string | undefined = undefined

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

			errorRedirectUrl = config.errorRedirectUrl
			const cancelUrl = params.cancelUrl || config.cancelUrl

			const quantity = Number(queryQuantity)

			const user = userId ? await adapter.getUser?.(userId as string) : false

			const upgradeFromPurchase = upgradeFromPurchaseId
				? await adapter.getPurchase(upgradeFromPurchaseId)
				: null

			const availableUpgrade =
				quantity === 1 && upgradeFromPurchase
					? await adapter.getUpgradableProducts({
							upgradableFromId: upgradeFromPurchase.productId,
							upgradableToId: productId as string,
						})
					: null

			const customerId = user
				? await findOrCreateStripeCustomerId(
						user.id,
						adapter,
						config.paymentsAdapter,
					)
				: false

			const loadedProduct = await adapter.getProduct(productId)

			const result = LoadedProductSchema.safeParse(loadedProduct)

			if (!result.success) {
				const errorMessages = result.error.errors
					.map((err) => err.message)
					.join(', ')

				// Send `errorMessages` to Sentry so we can deal with it right away.
				console.error(`No product (${productId}) was found (${errorMessages})`)

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

			const merchantProductIdentifier = merchantProduct?.identifier

			if (!merchantProduct) {
				throw new Error('No merchant product found')
			}

			const merchantPrice = await adapter.getMerchantPriceForProductId(
				merchantProduct.id,
			)

			const merchantPriceIdentifier = merchantPrice?.identifier

			if (!merchantPriceIdentifier || !merchantProductIdentifier) {
				throw new Error('No merchant price or product found')
			}

			const stripePrice = await config.paymentsAdapter.getPrice(
				merchantPriceIdentifier,
			)

			const isRecurring = stripePrice?.recurring

			// Calculate pricing to get stackable discounts
			const country = params.country || process.env.DEFAULT_COUNTRY || 'US'

			const productPrice = await adapter.getPriceForProduct(productId)
			const unitPrice = productPrice?.unitAmount || 0

			// Get active merchant coupon (default coupon should be selected)
			const { activeMerchantCoupon, usedCouponId: activeUsedCouponId } =
				await (async () => {
					// This is a simplified version - in production you'd want to use the same logic
					// as checkForAvailableCoupons, but for now we'll get the default coupon
					const defaultCoupons = await adapter.getDefaultCoupon([productId])
					if (defaultCoupons?.defaultMerchantCoupon) {
						return {
							activeMerchantCoupon: defaultCoupons.defaultMerchantCoupon,
							usedCouponId: defaultCoupons.defaultCoupon.id,
						}
					}
					return {
						activeMerchantCoupon: couponId
							? await adapter.getMerchantCoupon(couponId as string)
							: null,
						usedCouponId: usedCouponId,
					}
				})()

			// Only enable stacking if the user has an entitlement-based coupon
			// Stacking should ONLY happen when there's an entitlement (special credit)

			const specialCreditEntitlementType =
				adapter && userId
					? await adapter.getEntitlementTypeByName('apply_special_credit')
					: null
			const entitlementTypeId = specialCreditEntitlementType?.id

			const hasEntitlementCoupon =
				userId && entitlementTypeId && adapter
					? (
							await adapter.getEntitlementsForUser({
								userId,
								sourceType: 'COUPON',
								entitlementType: entitlementTypeId,
							})
						).length > 0
					: false

			const pricingResult = await formatPricesForProduct({
				productId,
				country,
				quantity,
				merchantCouponId: activeMerchantCoupon?.id,
				...(upgradeFromPurchaseId && { upgradeFromPurchaseId }),
				userId,
				autoApplyPPP: true,
				preferStacking: hasEntitlementCoupon,
				usedCouponId: activeUsedCouponId,
				ctx: adapter,
			})

			const merchantCoupon = couponId
				? await adapter.getMerchantCoupon(couponId as string)
				: activeMerchantCoupon

			const stripeCouponPercentOff =
				merchantCoupon && merchantCoupon.identifier
					? await config.paymentsAdapter.getCouponPercentOff(
							merchantCoupon.identifier,
						)
					: 0

			const stripeCouponAmountOff =
				merchantCoupon && merchantCoupon.identifier
					? await config.paymentsAdapter.getCouponAmountOff(
							merchantCoupon.identifier,
						)
					: 0

			let discounts = []
			let appliedPPPStripeCouponId: string | undefined | null = undefined
			let upgradedFromPurchaseId: string | undefined | null = undefined

			// Handle stackable discounts - create a combined coupon in Stripe
			const stackableDiscounts = pricingResult.stackableDiscounts || []
			const stackingPath = pricingResult.stackingPath || 'none'

			const usedEntitlementCouponIds = stackableDiscounts
				.filter((discount) => discount.source === 'entitlement')
				.map((discount) => discount.couponId)
				.filter((id): id is string => Boolean(id))
				.join(',')

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

				const fullPrice = productPrice?.unitAmount || 0
				const calculatedPrice = getCalculatedPrice({
					unitPrice: fullPrice,
					percentOfDiscount: stripeCouponPercentOff,
					amountDiscount: stripeCouponAmountOff,
					quantity: 1,
					fixedDiscount: fixedDiscountForIndividualUpgrade,
				})

				const upgradeFromProduct = await adapter.getProduct(
					upgradeFromPurchase.productId,
				)

				if (fixedDiscountForIndividualUpgrade > 0) {
					const couponName = buildCouponName(
						{ ...upgradeFromPurchase, product: upgradeFromProduct },
						productId,
						availableUpgrade?.[0] || null,
						purchaseWillBeRestricted,
						stripeCouponPercentOff,
					)

					const amount_off_in_cents = (fullPrice - calculatedPrice) * 100

					const couponId = await config.paymentsAdapter.createCoupon({
						amount_off: amount_off_in_cents,
						name: couponName,
						max_redemptions: 1,
						redeem_by: TWELVE_FOUR_HOURS_FROM_NOW,
						currency: 'USD',
						applies_to: {
							products: [merchantProductIdentifier],
						},
					})

					// Store the newly created upgrade coupon in the database for tracking
					await adapter.createMerchantCoupon({
						identifier: couponId,
						merchantAccountId: merchantProduct.merchantAccountId,
						type: 'upgrade',
						amountDiscount: amount_off_in_cents,
					})

					discounts.push({
						coupon: couponId,
					})
				}
			}
			// Stripe only allows ONE discount per checkout, so we combine all stackable discounts into one coupon
			// We create ONE reusable Stripe coupon and multiple promotion codes (one per checkout)
			if (
				!isUpgrade &&
				stackingPath === 'stack' &&
				stackableDiscounts.length > 0
			) {
				const totalDiscountInCents = Math.round(
					(pricingResult.totalDiscountAmount || 0) * 100,
				)

				if (totalDiscountInCents > 0) {
					// Find or create a reusable merchant coupon for this discount amount
					// This ensures we only create ONE Stripe coupon per discount amount,
					// and reuse it for all users with the same combined discount
					let stackedMerchantCoupon =
						await adapter.getMerchantCouponForTypeAndAmount({
							type: 'stacked',
							amountDiscount: totalDiscountInCents,
						})

					let stripeCouponIdentifier: string

					if (stackedMerchantCoupon?.identifier) {
						stripeCouponIdentifier = stackedMerchantCoupon.identifier
					} else {
						stripeCouponIdentifier = await config.paymentsAdapter.createCoupon({
							amount_off: totalDiscountInCents,
							name: `Stacked Discount $${(totalDiscountInCents / 100).toFixed(2)}`,
							duration: 'forever',
							currency: 'USD',
							metadata: {
								type: 'stacked',
							},
						})

						await adapter.createMerchantCoupon({
							identifier: stripeCouponIdentifier,
							merchantAccountId: merchantProduct.merchantAccountId,
							type: 'stacked',
							amountDiscount: totalDiscountInCents,
						})
					}

					const promotionCodeId =
						await config.paymentsAdapter.createPromotionCode({
							coupon: stripeCouponIdentifier,
							max_redemptions: 1,
							expires_at: TWELVE_FOUR_HOURS_FROM_NOW,
						})

					discounts.push({
						promotion_code: promotionCodeId,
					})
				}
			} else if (merchantCoupon) {
				// no ppp for bulk purchases
				const isNotPPP = merchantCoupon.type !== 'ppp'
				if (isNotPPP || quantity === 1) {
					appliedPPPStripeCouponId =
						merchantCoupon.type === 'ppp'
							? merchantCoupon?.identifier
							: undefined

					// Handle fixed amount discounts vs percentage discounts
					if (merchantCoupon.amountDiscount) {
						if (quantity > 1) {
							// For multi-seat purchases, create a coupon with adjusted amount
							const couponId = await config.paymentsAdapter.createCoupon({
								amount_off: merchantCoupon.amountDiscount * quantity,
								name: merchantCoupon.type || 'Fixed Discount',
								max_redemptions: 1,
								redeem_by: TWELVE_FOUR_HOURS_FROM_NOW,
								currency: 'USD',
								applies_to: {
									products: [merchantProductIdentifier],
								},
							})

							// Store the newly created coupon in the database for tracking
							await adapter.createMerchantCoupon({
								identifier: couponId,
								merchantAccountId: merchantProduct.merchantAccountId,
								type: `${merchantCoupon.type} bulk`,
								amountDiscount: merchantCoupon.amountDiscount * quantity,
							})

							discounts.push({
								coupon: couponId,
							})
						} else if (merchantCoupon.identifier) {
							// For single seat, use promotion code with original coupon
							const promotionCodeId =
								await config.paymentsAdapter.createPromotionCode({
									coupon: merchantCoupon.identifier,
									max_redemptions: 1,
									expires_at: TWELVE_FOUR_HOURS_FROM_NOW,
								})
							discounts.push({
								promotion_code: promotionCodeId,
							})
						}
					} else if (merchantCoupon.identifier) {
						// For percentage discounts, use promotion code
						const promotionCodeId =
							await config.paymentsAdapter.createPromotionCode({
								coupon: merchantCoupon.identifier,
								max_redemptions: 1,
								expires_at: TWELVE_FOUR_HOURS_FROM_NOW,
							})
						discounts.push({
							promotion_code: promotionCodeId,
						})
					}
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

				if (isRecurring) {
					const queryParamString = buildSearchParams(baseQueryParams)
					return `${config.baseSuccessUrl}/thanks/subscription?${queryParamString}`
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

			const metadata = CheckoutSessionMetadataSchema.parse({
				...(Boolean(availableUpgrade && upgradeFromPurchase) && {
					upgradeFromPurchaseId: upgradeFromPurchaseId as string,
				}),
				bulk: Boolean(bulk) ? 'true' : quantity > 1 ? 'true' : 'false',
				...(appliedPPPStripeCouponId && { appliedPPPStripeCouponId }),
				...(upgradedFromPurchaseId && { upgradedFromPurchaseId }),
				country: params.country || process.env.DEFAULT_COUNTRY || 'US',
				ip_address: ip_address || '',
				...(usedCouponId && { usedCouponId }),
				...(usedEntitlementCouponIds && {
					usedEntitlementCouponIds,
				}),
				productId: loadedProduct.id,
				product: loadedProduct.name,
				...(user && { userId: user.id }),
				...(process.env.NEXT_PUBLIC_APP_NAME && {
					siteName: process.env.NEXT_PUBLIC_APP_NAME,
				}),
				...(params.organizationId && { organizationId: params.organizationId }),
				...(merchantCoupon && {
					discountType: merchantCoupon.amountDiscount ? 'fixed' : 'percentage',
					discountAmount: merchantCoupon.amountDiscount
						? merchantCoupon.amountDiscount
						: stripeCouponPercentOff * 100,
				}),
			})

			const sessionUrl = await config.paymentsAdapter.createCheckoutSession({
				discounts,
				line_items: [
					{
						price: merchantPriceIdentifier,
						quantity: Number(quantity),
					},
				],
				expires_at: TWELVE_FOUR_HOURS_FROM_NOW,
				mode: isRecurring ? 'subscription' : 'payment',
				success_url: successUrl,
				cancel_url: cancelUrl,
				...(isRecurring
					? customerId
						? { customer: customerId }
						: user && { customer_email: user.email }
					: customerId
						? { customer: customerId }
						: { customer_creation: 'always' }),
				metadata,
				...(!isRecurring && {
					payment_intent_data: {
						metadata,
					},
				}),
			})

			if (sessionUrl) {
				return {
					redirect: sessionUrl,
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
			console.error('err', err)
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
