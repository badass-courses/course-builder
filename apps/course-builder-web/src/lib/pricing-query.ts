import { courseBuilderAdapter, db } from '@/db'
import { purchases } from '@/db/schema'
import { eq } from 'drizzle-orm'

import { formatPricesForProduct } from '@coursebuilder/core'
import { Purchase } from '@coursebuilder/core/schemas'
import { type FormattedPrice } from '@coursebuilder/core/types'

export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

export async function getPricingData(
	productId?: string | null,
): Promise<PricingData> {
	if (!productId)
		return {
			formattedPrice: null,
			purchaseToUpgrade: null,
			quantityAvailable: -1,
		}

	const formattedPrice = await formatPricesForProduct({
		productId,
		ctx: courseBuilderAdapter,
	})

	const product = await courseBuilderAdapter.getProduct(productId)
	const totalPurchases = await db.query.purchases.findMany({
		where: eq(purchases.productId, productId),
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
