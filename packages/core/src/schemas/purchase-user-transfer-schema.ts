import { z } from 'zod'

export const purchaseUserTransferSchema = z.object({
	id: z.string().max(191),
	transferState: z
		.enum([
			'AVAILABLE',
			'INITIATED',
			'VERIFIED',
			'CANCELED',
			'EXPIRED',
			'CONFIRMED',
			'COMPLETED',
		])
		.default('AVAILABLE'),
	purchaseId: z.string().max(191),
	sourceUserId: z.string().max(191),
	targetUserId: z.string().max(191).optional().nullable(),
	createdAt: z.date().nullable(),
	expiresAt: z.date().nullable(),
	canceledAt: z.date().nullable(),
	confirmedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
})

export type PurchaseUserTransfer = z.infer<typeof purchaseUserTransferSchema>

export type PurchaseUserTransferState =
	| 'AVAILABLE'
	| 'INITIATED'
	| 'VERIFIED'
	| 'CANCELED'
	| 'EXPIRED'
	| 'CONFIRMED'
	| 'COMPLETED'
