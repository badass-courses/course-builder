import { sum } from '@coursebuilder/nodash'

import { CourseBuilderAdapter } from '../../adapters'
import { Price, Product, Purchase } from '../../schemas'
import { FormatPricesForProductOptions, FormattedPrice } from '../../types'
import { determineCouponToApply } from './determine-coupon-to-apply.js'
import { getCalculatedPrice } from './get-calculated-price.js'

// 10% premium for an upgrade
// TODO: Display Coupon Errors
// TODO: Display Applied Site Coupon w/ Expiration
// departure from the three tiers we've used in the past and the third tier
// is for teams

export class PriceFormattingError extends Error {
	options: Partial<FormatPricesForProductOptions>

	constructor(
		message: string,
		options: Partial<FormatPricesForProductOptions>,
	) {
		super(message)
		this.name = 'PriceFormattingError'
		this.options = options
	}
}

async function getChainOfPurchases({
	purchase,
	ctx,
}: {
	purchase: Purchase | null
	ctx: CourseBuilderAdapter
}): Promise<Purchase[]> {
	if (purchase === null) {
		return []
	} else {
		const { getPurchase } = ctx
		const { upgradedFromId } = purchase

		const purchaseThisWasUpgradedFrom = upgradedFromId
			? await getPurchase(upgradedFromId)
			: null

		return [
			purchase,
			...(await getChainOfPurchases({
				purchase: purchaseThisWasUpgradedFrom,
				ctx,
			})),
		]
	}
}

export async function getFixedDiscountForIndividualUpgrade({
	purchaseToBeUpgraded,
	productToBePurchased,
	purchaseWillBeRestricted,
	userId,
	ctx,
}: {
	purchaseToBeUpgraded: Purchase | null
	productToBePurchased: Product
	purchaseWillBeRestricted: boolean
	userId: string | undefined
	ctx: CourseBuilderAdapter
}) {
	// if there is no purchase to be upgraded, then this isn't an upgrade
	// and the Fixed Discount should be 0.
	if (
		purchaseToBeUpgraded === null ||
		purchaseToBeUpgraded?.productId === undefined
	) {
		return 0
	}

	const transitioningToUnrestrictedAccess =
		purchaseToBeUpgraded.status === 'Restricted' && !purchaseWillBeRestricted

	// if the Purchase To Be Upgraded is `restricted` and it has a matching
	// `productId` with the Product To Be Purchased, then this is a PPP
	// upgrade, so use the total purchase amount as the fixed discount.
	if (transitioningToUnrestrictedAccess) {
		const purchaseChain = await getChainOfPurchases({
			purchase: purchaseToBeUpgraded,
			ctx,
		})

		const totalInDollars = sum(
			purchaseChain.map((purchase) => purchase.totalAmount),
		)
		return totalInDollars // totalAmount is already in dollars
	}

	// if Purchase To Be Upgraded is upgradeable to the Product To Be Purchased,
	// then look up the Price of the original product
	const { availableUpgradesForProduct, pricesOfPurchasesTowardOneBundle } = ctx

	const availableUpgrades = await availableUpgradesForProduct(
		[purchaseToBeUpgraded],
		productToBePurchased.id,
	)

	const upgradeIsAvailable = availableUpgrades.length > 0

	if (upgradeIsAvailable) {
		const pricesToBeDiscounted = await pricesOfPurchasesTowardOneBundle({
			userId,
			bundleId: productToBePurchased.id,
		})

		const pricesArray = pricesToBeDiscounted.map((price: Price) => {
			return price.unitAmount
		})

		return sum(pricesArray)
	}

	return 0
}

/**
 * Creates a verified price for a given product based on the unit price
 * of the product, coupons, and other factors.
 *
 * 30 minute loom walkthrough of this function:
 * https://www.loom.com/share/8cbd2213d44145dea51590b380f5d0d7?sid=bec3caeb-b742-4425-ae6e-81ca98c88f91
 *
 * @param {FormatPricesForProductOptions} options the Prisma context
 */
export async function formatPricesForProduct(
	options: FormatPricesForProductOptions,
): Promise<FormattedPrice> {
	const { ctx, ...noContextOptions } = options
	const {
		productId,
		country = 'US',
		quantity = 1,
		merchantCouponId,
		upgradeFromPurchaseId,
		userId,
		autoApplyPPP = true,
		usedCouponId,
	} = noContextOptions

	if (!productId) throw new Error('productId is required')

	const { getProduct, getPriceForProduct, getPurchase, getCoupon } = ctx

	const usedCoupon = usedCouponId ? await getCoupon(usedCouponId) : null

	// TODO subscription versus single purchase

	const upgradeFromPurchase = upgradeFromPurchaseId
		? await getPurchase(upgradeFromPurchaseId)
		: null

	const upgradedProduct = upgradeFromPurchase
		? await getProduct(upgradeFromPurchase.productId)
		: null

	const product = await getProduct(productId)

	if (!product) {
		throw new PriceFormattingError(`no-product-found`, noContextOptions)
	}

	const price = await getPriceForProduct(productId)

	if (!price) throw new PriceFormattingError(`no-price-found`, noContextOptions)

	// TODO: give this function a better name like, `determineCouponDetails`
	const {
		appliedMerchantCoupon,
		appliedCouponType,
		appliedDiscountType,
		...result
	} = await determineCouponToApply({
		prismaCtx: ctx,
		merchantCouponId,
		country,
		quantity,
		userId,
		productId: product.id,
		purchaseToBeUpgraded: upgradeFromPurchase,
		autoApplyPPP,
		usedCoupon,
		unitPrice: price.unitAmount,
	})

	const fireFixedDiscountForIndividualUpgrade = async () => {
		return await getFixedDiscountForIndividualUpgrade({
			purchaseToBeUpgraded: upgradeFromPurchase,
			productToBePurchased: product,
			purchaseWillBeRestricted: appliedCouponType === 'ppp',
			userId,
			ctx,
		})
	}

	// Right now, we have fixed discounts to apply to upgrades for individual
	// purchases. If it is a bulk purchase, a fixed discount shouldn't be
	// applied. It's likely this will change in the future, so this allows us
	// to handle both and distinguishes them as two different flows.
	const fixedDiscountForUpgrade = result.bulk
		? 0
		: await fireFixedDiscountForIndividualUpgrade()

	const unitPrice: number = price.unitAmount
	const fullPrice: number = unitPrice * quantity

	const percentOfDiscount =
		appliedMerchantCoupon?.percentageDiscount ?? undefined
	const amountDiscount = appliedMerchantCoupon?.amountDiscount || 0

	// Discount stacking rules:
	// - Upgrade credit + percentage coupon: STACK (apply both)
	// - Upgrade credit + fixed amount coupon: CHOOSE BETTER (don't stack)
	// Note: PPP vs other coupons is handled in determine-coupon-to-apply
	let finalFixedDiscount = fixedDiscountForUpgrade
	let finalPercentDiscount = percentOfDiscount
	let finalAmountDiscount = amountDiscount

	if (fixedDiscountForUpgrade > 0 && amountDiscount > 0) {
		// Both upgrade credit and fixed amount coupon exist
		// Choose whichever gives the better discount
		const upgradeDiscountAmount = fixedDiscountForUpgrade
		const merchantDiscountAmount = (amountDiscount / 100) * quantity // Convert cents to dollars and apply per seat

		if (upgradeDiscountAmount >= merchantDiscountAmount) {
			// Upgrade discount is better, don't apply merchant coupon
			finalAmountDiscount = 0
		} else {
			// Merchant coupon is better, don't apply upgrade discount
			finalFixedDiscount = 0
		}
	}
	// If upgrade credit + percentage coupon, both are applied (no special handling needed)

	// Calculate fullPrice as price after upgrade discount but before merchant coupon
	const fullPriceWithUpgrade = fullPrice - fixedDiscountForUpgrade

	const upgradeDetails =
		upgradeFromPurchase !== null && appliedCouponType !== 'bulk' // we don't handle bulk with upgrades (yet), so be explicit here
			? {
					upgradeFromPurchaseId,
					upgradeFromPurchase,
					upgradedProduct,
				}
			: {}

	return {
		...product,
		quantity,
		unitPrice,
		fullPrice: fixedDiscountForUpgrade > 0 ? fullPriceWithUpgrade : fullPrice,
		fixedDiscountForUpgrade,
		calculatedPrice: getCalculatedPrice({
			unitPrice,
			percentOfDiscount: finalPercentDiscount,
			fixedDiscount: finalFixedDiscount,
			amountDiscount: finalAmountDiscount,
			quantity,
		}),
		availableCoupons: result.availableCoupons,
		appliedMerchantCoupon,
		appliedDiscountType,
		appliedFixedDiscount:
			amountDiscount > 0 ? (amountDiscount / 100) * quantity : undefined,
		...(usedCoupon?.merchantCouponId === appliedMerchantCoupon?.id && {
			usedCouponId,
		}),
		bulk: result.bulk,
		...upgradeDetails,
	}
}
