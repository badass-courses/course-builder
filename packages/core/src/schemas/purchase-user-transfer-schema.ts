import { z } from 'zod'

const purchaseUserTransferSchema = z.object({
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
	targetUserId: z.string().max(191).optional(),
	createdAt: z
		.string()
		.datetime()
		.default(() => new Date().toISOString()),
	expiresAt: z.string().datetime().optional(),
	canceledAt: z.string().datetime().optional(),
	confirmedAt: z.string().datetime().optional(),
	completedAt: z.string().datetime().optional(),
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
