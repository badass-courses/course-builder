import { courseBuilderAdapter, db } from '@/db'
import { purchases } from '@/db/schema'
import { eq } from 'drizzle-orm'

import { formatPricesForProduct } from '@coursebuilder/core'
import { Purchase } from '@coursebuilder/core/schemas'
import {
	type FormatPricesForProductOptions,
	type FormattedPrice,
} from '@coursebuilder/core/types'

export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

export async function getPricingData(
	options: Partial<FormatPricesForProductOptions>,
): Promise<PricingData> {
	if (!options.productId)
		return {
			formattedPrice: null,
			purchaseToUpgrade: null,
			quantityAvailable: -1,
		}

	const formattedPrice = await formatPricesForProduct({
		...options,
		ctx: courseBuilderAdapter,
	})

	const product = await courseBuilderAdapter.getProduct(options.productId)
	const totalPurchases = await db.query.purchases.findMany({
		where: eq(purchases.productId, options.productId),
	})

	const purchaseToUpgrade = formattedPrice.upgradeFromPurchaseId
		? await courseBuilderAdapter.getPurchase(
				formattedPrice.upgradeFromPurchaseId,
			)
		: null
	return {
		formattedPrice,
		purchaseToUpgrade,
		quantityAvailable:
			(product?.quantityAvailable || 0) - totalPurchases.length,
	}
}
