import { first } from 'lodash'
import { v4 } from 'uuid'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import {
	formatPricesForProduct,
	getFixedDiscountForIndividualUpgrade,
} from '@coursebuilder/core/lib/pricing/format-prices-for-product'
import { getCalculatedPrice } from '@coursebuilder/core/lib/pricing/get-calculated-price'
import { Coupon, Product, Purchase } from '@coursebuilder/core/schemas'

import { TestOptions } from './adapter.js'

export async function runFormatPricingTests(options: TestOptions) {
	let ctx: CourseBuilderAdapter = options.adapter

	beforeEach(async () => {
		await options.db.createProduct?.(options.fixtures?.product)
		await options.db.createStandardMerchantCoupons?.()
		await options.db.createMerchantCoupon?.(options.fixtures?.coupon)
	})

	afterEach(async () => {
		await options.db.deleteProduct?.(options.fixtures?.product?.id)
		await options.db.deleteMerchantCoupons?.()
		await options.db.deletePurchases?.(options.fixtures?.product?.id)
	})

	test('basic product returns product', async () => {
		await expect(
			formatPricesForProduct({
				productId: options.fixtures?.product?.id,
				ctx,
			}),
		).resolves.toBeDefined()
	})

	test('basic product calculatedPrice matches unitPrice', async () => {
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			ctx,
		})
		const expectedPrice = product?.unitPrice
		expect(expectedPrice).toBe(product?.calculatedPrice)
	})

	test('product with quantity under 5 calculatedPrice multiplies unitPrice', async () => {
		const quantity = 2
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			quantity,
			ctx,
		})
		const expectedPrice = product?.unitPrice * quantity
		expect(expectedPrice).toBe(product?.calculatedPrice)
	})

	test('applies sale coupon as default', async () => {
		const { expectedPrice, calculatedPrice } =
			await expectedPriceForDefaultCoupon()
		expect(expectedPrice).toBe(calculatedPrice)
	})

	describe('bulk discount', () => {
		beforeEach(async () => {})

		for (const quantity of [7, 13, 26, 42]) {
			test(`applies sale coupon when bulk [${quantity}] discount is smaller`, async () => {
				const { expectedPrice, calculatedPrice } =
					await expectedPriceForDefaultCoupon(quantity)

				expect(expectedPrice).toBe(calculatedPrice)
			})
		}

		for (const quantity of [69, 89, 99]) {
			test(`applies bulk [${quantity}] discount is more than default`, async () => {
				const { calculatedPrice, unitPrice, appliedMerchantCoupon } =
					await formatPricesForProduct({
						productId: options.fixtures?.product?.id,
						quantity,
						merchantCouponId: options.fixtures?.coupon?.id,
						ctx,
					})

				const expectedPrice = getCalculatedPrice({
					unitPrice,
					percentOfDiscount: appliedMerchantCoupon?.percentageDiscount,
					quantity,
				})

				expect(expectedPrice).toBe(calculatedPrice)
			})
		}
	})

	test('does not apply restricted coupon to other product', async () => {
		const OTHER_PRODUCT_ID = v4()
		const ONE_OFF_COUPON_FROM_CODE = v4()
		const ONE_OFF_MERCHANT_COUPON_ID = v4()

		await options.db.createProduct?.({
			id: OTHER_PRODUCT_ID,
			name: 'basic',
			createdAt: new Date(),
			key: 'hey',
			status: 1,
			quantityAvailable: -1,
			fields: {
				slug: 'basic',
			},
		})

		const mockOneOffCoupon = {
			id: ONE_OFF_COUPON_FROM_CODE,
			merchantCouponId: ONE_OFF_MERCHANT_COUPON_ID,
			restrictedToProductId: OTHER_PRODUCT_ID,
			percentageDiscount: 0.2,
		} as Coupon

		const mockOneOffMerchantCoupon = {
			id: ONE_OFF_MERCHANT_COUPON_ID,
			type: 'special',
			percentageDiscount: 0.2,
			identifier: v4(),
			status: 1,
			merchantAccountId: 'merchant-account',
		}

		await options.db.createCoupon?.(mockOneOffCoupon)
		await options.db.createMerchantCoupon?.(mockOneOffMerchantCoupon)

		const { calculatedPrice, unitPrice, appliedMerchantCoupon } =
			await formatPricesForProduct({
				productId: options.fixtures?.product?.id,
				quantity: 1,
				merchantCouponId: ONE_OFF_MERCHANT_COUPON_ID,
				usedCouponId: ONE_OFF_COUPON_FROM_CODE,
				ctx,
			})

		const expectedPrice = 100

		expect(expectedPrice).toBe(calculatedPrice)
		expect(appliedMerchantCoupon).toBe(undefined)
	})

	test('product with quantity 5 calculatedPrice to have discount applied', async () => {
		const quantity = 5
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			quantity,
			ctx,
		})
		const expectedPrice = 475

		expect(expectedPrice).toBe(product?.calculatedPrice)
	})

	test('multiple purchases meeting quantity threshold have bulk discount applied', async () => {
		const userId = v4()

		const basePurchaseValues = getMockExistingBulkPurchase(
			userId,
			options.fixtures?.product?.id,
			3,
		)
		const bulkCoupon = await options.db.createCoupon?.({
			id: `coupon-${v4()}`,
			identifier: `coupon-${v4()}`,
			maxUses: 3,
			status: 1,
			merchantAccountId: 'merchant-account',
			usedCount: 3,
			percentageDiscount: 1.0,
			restrictedToProductId: options.fixtures?.product?.id,
		})

		await options.db.createPurchase?.({
			...basePurchaseValues,
			userId,
			bulkCouponId: bulkCoupon.id,
		})

		const quantity = 2
		const { calculatedPrice } = await formatPricesForProduct({
			userId,
			productId: options.fixtures?.product?.id,
			quantity,
			ctx,
		})
		const expectedPrice = 190 // discounted 5% on 200

		expect(expectedPrice).toBe(calculatedPrice)
	})

	test('product no available coupons if country is "US"', async () => {
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			country: 'US',
			ctx,
		})

		expect(product?.availableCoupons.length).toBe(0)
	})

	test('upgrade PPP purchase to unrestricted access', async () => {
		const ORIGINAL_PPP_PURCHASE_ID = v4()
		const originalPurchasePrice = 25
		// mock the purchase to be upgraded, which was PPP restricted

		await options.db.createPurchase?.({
			id: ORIGINAL_PPP_PURCHASE_ID,
			productId: options.fixtures?.product?.id,
			userId: options.fixtures?.user?.id,
			createdAt: new Date(),
			status: 'Restricted',
			totalAmount: originalPurchasePrice,
		})

		const price = await options.db.getPriceForProduct?.(
			options.fixtures?.product?.id,
		)

		const expectedPrice = price.unitAmount - originalPurchasePrice

		const { calculatedPrice } = await formatPricesForProduct({
			userId: options.fixtures?.user?.id,
			productId: options.fixtures?.product?.id,
			upgradeFromPurchaseId: ORIGINAL_PPP_PURCHASE_ID,
			country: 'US',
			ctx,
		})

		expect(expectedPrice).toBe(calculatedPrice)
	})

	test('upgrade PPP Purchase to Bundle w/ Unrestricted Access', async () => {
		const originalPurchasePrice = 25

		const { originalPurchaseId, upgradedProductId } =
			await mockPPPPurchaseAndUpgradeProduct()

		const expectedPrice = 200 - originalPurchasePrice

		const product = await formatPricesForProduct({
			productId: upgradedProductId,
			upgradeFromPurchaseId: originalPurchaseId,
			country: 'US',
			ctx,
		})

		expect(product.calculatedPrice).toBe(expectedPrice)
	})

	test('an applied coupon should calculate the correct price even with ppp applied', async () => {
		const { calculatedPrice } = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			country: 'IN',
			merchantCouponId: options.fixtures?.coupon?.id,
			ctx,
		})

		const productPrice = options.fixtures?.price?.unitAmount

		expect(calculatedPrice).toBe(
			productPrice -
				productPrice * Number(options.fixtures?.coupon?.percentageDiscount),
		)
	})

	test('PPP discount available if greater than sale price', async () => {
		const { availableCoupons } = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			country: 'IN',
			merchantCouponId: options.fixtures?.coupon?.id,
			ctx,
		})

		expect(availableCoupons.length).toBeGreaterThan(0)
	})

	test('PPP discount not available if less than sale price', async () => {
		const couponId = v4()
		await options.db.createCoupon?.({
			id: couponId,
			percentageDiscount: 0.9,
			status: 1,
			default: true,
			merchantCouponId: '3d7923347ea5', // see fixtures for standard
		})
		const { availableCoupons } = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			country: 'IN',
			merchantCouponId: '3d7923347ea5',
			ctx,
		})

		expect(availableCoupons.length).toBe(0)
	})

	test('product should have available coupons if country is "IN"', async () => {
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			country: 'IN',
			ctx,
		})

		expect(product?.availableCoupons.length).toBeGreaterThan(0)
	})

	test('available ppp coupons should have country "IN" set', async () => {
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			country: 'IN',
			ctx,
		})

		expect(first(product?.availableCoupons)?.country).toBe('IN')
	})

	test('available ppp coupons should have country "IN" set with active sale', async () => {
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			merchantCouponId: '32ff65cd9a78',
			country: 'IN',
			ctx,
		})

		expect(first(product?.availableCoupons)?.country).toBe('IN')
	})

	test('sale coupon should have id property when ppp available', async () => {
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			merchantCouponId: '32ff65cd9a78',
			country: 'IN',
			ctx,
		})

		expect(product.appliedMerchantCoupon?.id).toBeDefined()
	})

	test('product should have applied coupon present if "IN" and valid couponId', async () => {
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			merchantCouponId: '5d0a929cb56b',
			country: 'IN',
			ctx,
		})

		expect(product?.appliedMerchantCoupon).toBeDefined()
	})

	test('product should calculate discount if country is "IN" and couponId', async () => {
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			merchantCouponId: '5d0a929cb56b',
			country: 'IN',
			ctx,
		})

		const expectedPrice = 25

		expect(expectedPrice).toBe(product?.calculatedPrice)
	})

	test('PPP should be un-applied if quantity is over 1', async () => {
		const quantity = 3

		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			merchantCouponId: '5d0a929cb56b',
			country: 'IN',
			quantity,
			ctx,
		})

		const expectedPrice = 100 * quantity

		expect(expectedPrice).toBe(product?.calculatedPrice)
	})

	test('applied ppp coupon should have id property', async () => {
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			merchantCouponId: '5d0a929cb56b',
			country: 'IN',
			ctx,
		})

		expect(product.appliedMerchantCoupon?.id).toBeDefined()
	})

	test('applies fixed discount for previous purchase', async () => {
		const userId = options.fixtures?.user?.id
		const {
			originalPurchaseId,
			upgradedProductId,
			priceForProduct,
			originalPurchasePrice,
		} = await mockPPPPurchaseAndUpgradeProduct()

		const { fullPrice, calculatedPrice } = await formatPricesForProduct({
			productId: upgradedProductId,
			upgradeFromPurchaseId: originalPurchaseId,
			userId,
			ctx,
		})

		const expectedPrice = priceForProduct.unitAmount - originalPurchasePrice

		expect(fullPrice).toBe(expectedPrice)
		expect(calculatedPrice).toBe(expectedPrice)
	})

	test('applies fixed discount for all previous purchases on PPP upgrade', async () => {
		const {
			upgradedProductId,
			upgradedPurchaseId,
			priceForProduct,
			originalPurchasePrice,
			upgradePurchasePrice,
		} = await mockTwoPurchasePPPPathToUpgradeProduct()

		// Price differential:
		// 200 - (25 + 20) => 155
		const expectedUpgradedPrice =
			priceForProduct.unitAmount -
			(originalPurchasePrice + upgradePurchasePrice)

		const product = await formatPricesForProduct({
			productId: upgradedProductId,
			upgradeFromPurchaseId: upgradedPurchaseId,
			ctx,
		})

		expect(product.calculatedPrice).toBe(expectedUpgradedPrice)
	})

	test('applies previous-purchase fixed discount and site-wide discount', async () => {
		const userId = options.fixtures?.user?.id
		// 20% site-wide discount

		const {
			originalPurchaseId,
			upgradedProductId,
			priceForProduct,
			originalPurchasePrice,
		} = await mockPurchaseAndUpgradeProduct()

		const { fullPrice, calculatedPrice } = await formatPricesForProduct({
			productId: upgradedProductId,
			upgradeFromPurchaseId: originalPurchaseId,
			merchantCouponId: options.fixtures?.coupon?.id,
			userId,
			ctx,
		})

		const expectedFullPrice = priceForProduct.unitAmount - originalPurchasePrice
		const expectedCalculatedPrice =
			expectedFullPrice * (1 - options.fixtures?.coupon?.percentageDiscount)

		expect(fullPrice).toBe(expectedFullPrice)
		expect(calculatedPrice).toBe(expectedCalculatedPrice)
	})

	test('PPP is auto-applied to upgrade when original purchase was PPP', async () => {
		const userId = options.fixtures?.user?.id
		const { upgradedProductId, originalPurchaseId, priceForProduct } =
			await mockPPPPurchaseAndUpgradeProduct()

		const { calculatedPrice } = await formatPricesForProduct({
			productId: upgradedProductId,
			upgradeFromPurchaseId: originalPurchaseId,
			country: 'IN',
			userId,
			ctx,
		})

		expect(calculatedPrice).toBe(Number(priceForProduct.unitAmount) * 0.25)
	})

	test('PPP can be forced to not auto-apply for upgrade', async () => {
		const {
			upgradedProductId,
			originalPurchaseId,
			priceForProduct,
			originalPurchasePrice,
		} = await mockPPPPurchaseAndUpgradeProduct()

		const product = await formatPricesForProduct({
			productId: upgradedProductId,
			upgradeFromPurchaseId: originalPurchaseId,
			country: 'IN',
			autoApplyPPP: false, // <-- instructing price formatter to *not* auto-apply PPP
			ctx,
		})

		// by not applying PPP, we are choosing to do an Unrestricted Bundle Upgrade
		// so the difference of the originally paid amount with the bundle price is
		// the calculated price.
		expect(product.calculatedPrice).toBe(
			Number(priceForProduct.unitAmount) - originalPurchasePrice,
		)
	})

	test('PPP coupon not available for non-ppp purchasers', async () => {
		await options.db.createPurchase?.({
			id: v4(),
			productId: options.fixtures?.product?.id,
			userId: options.fixtures?.user?.id,
			createdAt: new Date(),
			status: 'Valid',
			totalAmount: 100,
		})
		const product = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			userId: options.fixtures?.user?.id,
			country: 'IN',
			ctx,
		})

		expect(product.availableCoupons.length).toBe(0)
	})

	test('multiple purchases applies fixed discount for bundle upgrade', async () => {
		const purchaseOneId = v4()
		const purchaseTwoId = v4()
		const newUserId = v4()

		// a previous purchase that can be upgraded
		await options.db.createPurchase?.({
			id: purchaseOneId,
			productId: options.fixtures?.product?.id,
			userId: newUserId,
			createdAt: new Date(),
			status: 'Valid',
			totalAmount: 100,
		})

		// some other product that can be upgraded
		const anotherProductId = v4()
		const anotherProductPrice = {
			createdAt: new Date(),
			status: 1,
			productId: anotherProductId,
			nickname: 'another bundled product',
			unitAmount: 200,
		}
		await options.db.createProduct?.(
			{
				id: anotherProductId,
				name: 'way better bundle',
				createdAt: new Date(),
				key: 'like whoa',
				status: 1,
				quantityAvailable: -1,
				fields: {
					slug: 'another-bundled-product',
				},
			},
			anotherProductPrice,
		)

		// another previous purchase that can be upgraded
		await options.db.createPurchase?.({
			id: purchaseTwoId,
			productId: anotherProductId,
			userId: newUserId,
			createdAt: new Date(),
			status: 'Valid',
			totalAmount: 200,
		})

		// the bundled product that they are upgrading to
		const fancyProductId = v4()
		const priceForProduct = {
			createdAt: new Date(),
			status: 1,
			productId: fancyProductId,
			nickname: 'fancy',
			unitAmount: 500,
		}
		await options.db.createProduct?.(
			{
				id: fancyProductId,
				name: 'way better bundle',
				createdAt: new Date(),
				key: options.fixtures?.product?.key,
				status: 1,
				quantityAvailable: -1,
				fields: {
					slug: 'another-bundled-product',
				},
			},
			priceForProduct,
		)

		// this is the upgrade path from the two individual purchases
		const productToBePurchased =
			await options.adapter.getProduct(fancyProductId)

		// both products can be upgraded to the new fancy one
		await options.db.createUpgradableProduct?.(anotherProductId, fancyProductId)
		await options.db.createUpgradableProduct?.(
			options.fixtures?.product?.id,
			fancyProductId,
		)

		// could be either purchases, so we grab the first here
		const purchaseToBeUpgraded =
			await options.adapter.getPurchase(purchaseOneId)

		const fixedDiscount = await getFixedDiscountForIndividualUpgrade({
			purchaseToBeUpgraded: purchaseToBeUpgraded as unknown as Purchase,
			productToBePurchased: productToBePurchased as Product,
			purchaseWillBeRestricted: false, // not ppp
			userId: newUserId,
			ctx,
		})

		// this is the total amount of the two existing purchases that can be upgraded
		const expectedFixedDiscount =
			anotherProductPrice.unitAmount + options.fixtures?.price.unitAmount

		expect(fixedDiscount).toBe(expectedFixedDiscount)
	})

	const mockPPPPurchaseAndUpgradeProduct = async () => {
		const ORIGINAL_PPP_PURCHASE_ID = v4()
		const originalPurchasePrice = 25
		const newUser = v4()

		// mock the purchase to be upgraded, which was PPP restricted
		await options.db.createPurchase?.({
			id: ORIGINAL_PPP_PURCHASE_ID,
			productId: options.fixtures?.product?.id,
			userId: newUser,
			createdAt: new Date(),
			status: 'Restricted',
			totalAmount: originalPurchasePrice,
		})

		// create a fancy bundle to upgrade to
		const fancyProductId = v4()
		const priceForProduct = {
			createdAt: new Date(),
			status: 1,
			productId: fancyProductId,
			nickname: 'fancy',
			unitAmount: 200,
		}
		await options.db.createProduct?.(
			{
				id: fancyProductId,
				name: 'way better bundle',
				createdAt: new Date(),
				key: options.fixtures?.product?.key,
				status: 1,
				quantityAvailable: -1,
				fields: {
					slug: 'another-bundled-product',
				},
			},
			priceForProduct,
		)

		await options.db.createUpgradableProduct?.(
			options.fixtures?.product?.id,
			fancyProductId,
		)

		return {
			upgradedProductId: fancyProductId,
			originalPurchaseId: ORIGINAL_PPP_PURCHASE_ID,
			priceForProduct,
			originalPurchasePrice,
		}
	}

	const mockPurchaseAndUpgradeProduct = async () => {
		const ORIGINAL_PPP_PURCHASE_ID = v4()
		const originalPurchasePrice = 100

		// mock the purchase to be upgraded, which was PPP restricted
		await options.db.createPurchase?.({
			id: ORIGINAL_PPP_PURCHASE_ID,
			productId: options.fixtures?.product?.id,
			userId: options.fixtures?.user?.id,
			createdAt: new Date(),
			status: 'Restricted',
			totalAmount: originalPurchasePrice,
		})

		// create a fancy bundle to upgrade to
		const fancyProductId = v4()
		const priceForProduct = {
			createdAt: new Date(),
			status: 1,
			productId: fancyProductId,
			nickname: 'fancy',
			unitAmount: 200,
		}
		await options.db.createProduct?.(
			{
				id: fancyProductId,
				name: 'way better bundle',
				createdAt: new Date(),
				key: options.fixtures?.product?.key,
				status: 1,
				quantityAvailable: -1,
				fields: {
					slug: 'another-bundled-product',
				},
			},
			priceForProduct,
		)

		await options.db.createUpgradableProduct?.(
			options.fixtures?.product?.id,
			fancyProductId,
		)

		return {
			upgradedProductId: fancyProductId,
			originalPurchaseId: ORIGINAL_PPP_PURCHASE_ID,
			priceForProduct,
			originalPurchasePrice,
		}
	}

	const mockTwoPurchasePPPPathToUpgradeProduct = async () => {
		const ORIGINAL_PPP_PURCHASE_ID = v4()
		const UPGRADED_PPP_PURCHASE_ID = v4()
		const originalPurchasePrice = 25
		const fancyProductId = v4()

		// mock the purchase to be upgraded, which was PPP restricted
		await options.db.createPurchase?.({
			id: ORIGINAL_PPP_PURCHASE_ID,
			productId: options.fixtures?.product?.id,
			userId: options.fixtures?.user?.id,
			createdAt: new Date(),
			status: 'Restricted',
			totalAmount: originalPurchasePrice,
		})

		const upgradePurchasePrice = 20

		await options.db.createPurchase?.({
			id: UPGRADED_PPP_PURCHASE_ID,
			productId: fancyProductId,
			userId: options.fixtures?.user?.id,
			createdAt: new Date(),
			status: 'Restricted',
			totalAmount: upgradePurchasePrice,
			upgradedFromId: ORIGINAL_PPP_PURCHASE_ID,
		})

		// create a fancy bundle to upgrade to

		const priceForProduct = {
			createdAt: new Date(),
			status: 1,
			productId: fancyProductId,
			nickname: 'fancy',
			unitAmount: 200,
		}
		await options.db.createProduct?.(
			{
				id: fancyProductId,
				name: 'way better bundle',
				createdAt: new Date(),
				key: options.fixtures?.product?.key,
				status: 1,
				quantityAvailable: -1,
				fields: {
					slug: 'another-bundled-product',
				},
			},
			priceForProduct,
		)

		await options.db.createUpgradableProduct?.(
			options.fixtures?.product?.id,
			fancyProductId,
		)

		return {
			upgradedProductId: fancyProductId,
			originalPurchaseId: ORIGINAL_PPP_PURCHASE_ID,
			upgradedPurchaseId: UPGRADED_PPP_PURCHASE_ID,
			priceForProduct,
			originalPurchasePrice,
			upgradePurchasePrice,
		}
	}

	function getMockExistingBulkPurchase(
		userId: string,
		productId: string,
		quantity: number,
	) {
		const inconsequentialValues = {
			createdAt: new Date(),
			totalAmount: 300,
			ip_address: '',
			city: '',
			state: '',
			country: '',
			couponId: null,
			redeemedBulkCouponId: null,
			merchantChargeId: 'ch-123',
			upgradedFromId: null,
			status: 'Valid',
			bulkCouponId: 'coupon-123',
			merchantSessionId: 'ms-123',
		}

		return {
			id: 'purchase-123',
			userId,
			productId,

			...inconsequentialValues,
		}
	}

	async function expectedPriceForDefaultCoupon(quantity: number = 1) {
		const { getMerchantCoupon } = ctx
		const appliedMerchantCouponId = options.fixtures?.coupon?.id
		const appliedMerchantCoupon = await getMerchantCoupon(
			appliedMerchantCouponId,
		)

		const { calculatedPrice, unitPrice } = await formatPricesForProduct({
			productId: options.fixtures?.product?.id,
			quantity,
			merchantCouponId: appliedMerchantCouponId,
			ctx,
		})

		const expectedPrice = getCalculatedPrice({
			unitPrice: unitPrice,
			percentOfDiscount: appliedMerchantCoupon?.percentageDiscount || 0,
			quantity,
		})

		return {
			expectedPrice,
			calculatedPrice,
		}
	}
}
