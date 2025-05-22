import { InternalOptions, RequestInternal, ResponseInternal } from 'src/types'
import { z } from 'zod'

import { Cookie } from '../utils/cookie'

export async function claimed(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	if (!options.adapter) throw new Error('Adapter not found')

	const bulkCouponId = z
		.string()
		.optional()
		.parse(request.query?.bulkCouponId || request.body?.bulkCouponId)

	if (!bulkCouponId) throw new Error('Bulk coupon ID is required')

	const purchases =
		await options.adapter.getPurchasesForBulkCouponId(bulkCouponId)

	const users = purchases.map((purchase) => {
		return {
			name: purchase.user.name,
			email: purchase.user.email,
		}
	})

	return {
		body: users,
		headers: { 'Content-Type': 'application/json' },
		cookies,
	}
}
