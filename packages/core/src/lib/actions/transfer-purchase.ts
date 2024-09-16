import { v4 } from 'uuid'
import { z } from 'zod'

import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { Cookie } from '../utils/cookie'

export async function transferPurchase(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions<'payment'>,
): Promise<ResponseInternal> {
	if (!options.adapter) throw new Error('Adapter not found')
	if (request.headers?.['x-skill-secret'] !== process.env.SKILL_SECRET) {
		return { status: 401, body: 'unauthorized' }
	}

	const parsedTransferPurchaseOptions = z
		.object({
			purchaseId: z.string(),
			targetUserEmail: z.string(),
			sourceUserId: z.string(),
		})
		.safeParse(request.body)

	if (!parsedTransferPurchaseOptions.success) {
		return {
			status: 400,
			body: JSON.stringify({ error: parsedTransferPurchaseOptions.error }),
		}
	}
	try {
		const transferPurchaseOptions = parsedTransferPurchaseOptions.data

		let targetUser = await options.adapter.getUserByEmail(
			transferPurchaseOptions.targetUserEmail,
		)

		if (!targetUser) {
			targetUser = await options.adapter.createUser({
				id: v4(),
				email: transferPurchaseOptions.targetUserEmail,
				emailVerified: new Date(),
			})
		}

		await options.adapter.transferPurchaseToUser({
			sourceUserId: transferPurchaseOptions.sourceUserId,
			purchaseId: transferPurchaseOptions.purchaseId,
			targetUserId: targetUser.id,
		})

		const updatedPurchase = await options.adapter.getPurchase(
			transferPurchaseOptions.purchaseId,
		)

		return {
			status: 200,
			body: JSON.stringify(updatedPurchase),
		}
	} catch (e) {
		console.log('error', e)
		return {
			status: 500,
			body: JSON.stringify({ error: (e as Error).message }),
		}
	}
}
