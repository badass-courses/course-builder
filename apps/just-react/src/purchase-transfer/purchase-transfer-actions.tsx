'use server'

import process from 'process'
import { emailProvider } from '@/coursebuilder/email-provider'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import {
	merchantCharge,
	merchantCustomer,
	purchases as purchaseTable,
	purchaseUserTransfer as purchaseUserTransferTable,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { authOptions, getServerAuthSession } from '@/server/auth'
import { Theme } from '@auth/core/types'
import { render } from '@react-email/render'
import { and, eq, gte, isNull, or } from 'drizzle-orm'
import { Inngest } from 'inngest'
import type { NextAuthConfig } from 'next-auth'
import { v4 } from 'uuid'
import { z } from 'zod'

import { PURCHASE_TRANSFERRED_EVENT } from '@coursebuilder/core/inngest/purchase-transfer/event-purchase-transferred'
import { sendServerEmail } from '@coursebuilder/core/lib/send-server-email'
import {
	PurchaseUserTransfer,
	purchaseUserTransferSchema,
} from '@coursebuilder/core/schemas'
import PurchaseTransferEmail from '@coursebuilder/email-templates/emails/purchase-transfer'

export async function getPurchaseTransferById(input: { id: string }) {
	return await courseBuilderAdapter.getPurchaseUserTransferById({
		id: input.id,
	})
}

export async function cancelPurchaseTransfer(input: {
	purchaseUserTransferId: string
}) {
	const purchaseUserTransfer =
		await courseBuilderAdapter.getPurchaseUserTransferById({
			id: input.purchaseUserTransferId,
		})

	if (!purchaseUserTransfer) {
		throw new Error('No purchaseUserTransfer found')
	}

	if (purchaseUserTransfer.transferState !== 'INITIATED') {
		throw new Error('This transfer is not available')
	}

	await db
		.update(purchaseUserTransferTable)
		.set({
			transferState: 'CANCELED',
			canceledAt: new Date(),
		})
		.where(eq(purchaseUserTransferTable.id, purchaseUserTransfer.id))

	const newPutId = `put_${v4()}`
	await db.insert(purchaseUserTransferTable).values({
		id: newPutId,
		purchaseId: purchaseUserTransfer.purchaseId,
		transferState: 'AVAILABLE',
		expiresAt: purchaseUserTransfer.expiresAt,
		sourceUserId: purchaseUserTransfer.sourceUserId,
	})

	return db.query.purchaseUserTransfer.findFirst({
		where: eq(purchaseUserTransferTable.id, newPutId),
	})
}

export async function acceptPurchaseTransfer(input: {
	purchaseUserTransferId: string
	email?: string | null
}) {
	if (!input.email) {
		throw new Error('No email provided')
	}
	const token = await getServerAuthSession()
	const {
		updatePurchaseUserTransferTransferState,
		getPurchaseUserTransferById,
		getUserById,
	} = courseBuilderAdapter
	const purchaseUserTransfer = await getPurchaseUserTransferById({
		id: input.purchaseUserTransferId,
	})
	const user = token.session?.user
		? await getUserById(token.session.user.id)
		: null

	if (!user) {
		throw new Error('No user found')
	}

	if (!purchaseUserTransfer) {
		throw new Error('No purchaseUserTransfer found')
	}

	if (purchaseUserTransfer.targetUserId !== user.id) {
		throw new Error('You are not the target user')
	}

	if (purchaseUserTransfer.transferState !== 'INITIATED') {
		throw new Error('This transfer is not available')
	}

	if (
		purchaseUserTransfer.expiresAt &&
		purchaseUserTransfer.expiresAt < new Date()
	) {
		await updatePurchaseUserTransferTransferState({
			id: purchaseUserTransfer.id,
			transferState: 'EXPIRED',
		})
		throw new Error('This transfer has expired')
	}

	const purchase = await db.query.purchases.findFirst({
		where: eq(purchaseTable.id, purchaseUserTransfer.purchaseId),
		with: {
			merchantCharge: {
				with: {
					merchantCustomer: true,
				},
			},
		},
	})

	if (!purchase) {
		throw new Error('No purchase found')
	}

	if (purchase?.merchantCharge?.merchantCustomer) {
		const { identifier } = purchase.merchantCharge.merchantCustomer
		const existingCustomer = await stripeProvider.getCustomer(identifier)

		await stripeProvider.updateCustomer(identifier, {
			email: user.email,
			name: user.name || existingCustomer.name || user.email,
		})

		await db
			.update(merchantCharge)
			.set({
				userId: user.id,
			})
			.where(eq(merchantCharge.id, purchase.merchantCharge.id))

		await db
			.update(merchantCustomer)
			.set({
				userId: user.id,
			})
			.where(
				eq(merchantCustomer.id, purchase.merchantCharge.merchantCustomerId),
			)
	}

	await db
		.update(purchaseTable)
		.set({ userId: user.id })
		.where(eq(purchaseTable.id, purchaseUserTransfer.purchaseId))

	await db
		.update(purchaseUserTransferTable)
		.set({
			transferState: 'COMPLETED',
			completedAt: new Date(),
		})
		.where(eq(purchaseUserTransferTable.id, purchaseUserTransfer.id))

	if (process.env.INNGEST_EVENT_KEY) {
		const inngest = new Inngest({
			id:
				process.env.INNGEST_APP_NAME ||
				process.env.NEXT_PUBLIC_SITE_TITLE ||
				'Purchase Transfer',
			eventKey: process.env.INNGEST_EVENT_KEY,
		})

		await inngest.send({
			name: PURCHASE_TRANSFERRED_EVENT,
			data: {
				purchaseId: purchaseUserTransfer.purchaseId,
				sourceUserId: purchaseUserTransfer.sourceUserId,
				targetUserId: purchaseUserTransfer.targetUserId,
			},
			user,
		})
	}

	return {
		newPurchase: await db.query.purchases.findFirst({
			where: eq(purchaseTable.id, purchaseUserTransfer.purchaseId),
		}),
		completedTransfer: await db.query.purchaseUserTransfer.findFirst({
			where: eq(purchaseUserTransferTable.id, purchaseUserTransfer.id),
		}),
	}
}

export async function getPurchaseTransferForPurchaseId(input: {
	id: string
	sourceUserId?: string | null | undefined
}) {
	const { session } = await getServerAuthSession()
	const user = session?.user

	// Determine which user id we should lock the query to.
	// Priority: 1) authenticated user, 2) provided sourceUserId (for post-purchase flow)
	const ownerId = user?.id ?? input.sourceUserId ?? undefined

	if (!ownerId) {
		return []
	}

	const transfers = await db.query.purchaseUserTransfer.findMany({
		where: and(
			eq(purchaseUserTransferTable.sourceUserId, ownerId as string),
			eq(purchaseUserTransferTable.purchaseId, input.id as string),
			// include rows that never expire (NULL) or ones in the future
			or(
				isNull(purchaseUserTransferTable.expiresAt),
				gte(purchaseUserTransferTable.expiresAt, new Date()),
			),
		),
	})

	return z.array(purchaseUserTransferSchema).parse(transfers)
}

export async function initiatePurchaseTransfer(input: {
	purchaseUserTransferId: string
	email: string
}) {
	const purchaseUserTransfer =
		await courseBuilderAdapter.getPurchaseUserTransferById({
			id: input.purchaseUserTransferId,
		})

	if (!purchaseUserTransfer) {
		throw new Error('No purchaseUserTransfer found')
	}

	return await initiateTransfer({
		purchaseUserTransferId: purchaseUserTransfer.id,
		toEmail: input.email,
		nextAuthOptions: authOptions,
	})
}

const initiateTransfer = async ({
	purchaseUserTransferId,
	toEmail,
	nextAuthOptions,
}: {
	purchaseUserTransferId: string
	toEmail: string
	nextAuthOptions?: NextAuthConfig
}) => {
	const { user: toUser } = await courseBuilderAdapter.findOrCreateUser(
		toEmail.toLowerCase(),
	)
	const purchaseUserTransfer =
		await courseBuilderAdapter.getPurchaseUserTransferById({
			id: purchaseUserTransferId,
		})
	const canTransfer = await canInitiateTransfer({ purchaseUserTransfer })

	if (canTransfer) {
		await db
			.update(purchaseUserTransferTable)
			.set({
				targetUserId: toUser.id,
				transferState: 'INITIATED',
			})
			.where(eq(purchaseUserTransferTable.id, purchaseUserTransferId))

		const initiatedTransfer = await db.query.purchaseUserTransfer.findFirst({
			where: eq(purchaseUserTransferTable.id, purchaseUserTransferId),
		})

		if (!initiatedTransfer) {
			throw new Error('No purchaseUserTransfer found')
		}

		nextAuthOptions &&
			(await sendServerEmail({
				email: toUser.email,
				callbackUrl: `${process.env.NEXT_PUBLIC_URL}/transfer/${initiatedTransfer.id}`,
				baseUrl: env.COURSEBUILDER_URL,
				authOptions: nextAuthOptions,
				type: 'transfer',
				html: defaultHtml,
				text: defaultText,
				expiresAt: initiatedTransfer.expiresAt,
				adapter: courseBuilderAdapter,
				emailProvider: emailProvider,
			}))
	}
}

const canInitiateTransfer = async ({
	purchaseUserTransfer,
}: {
	purchaseUserTransfer: PurchaseUserTransfer | null
}) => {
	if (!purchaseUserTransfer) {
		return false
	}

	const isNotAvailable = purchaseUserTransfer.transferState !== 'AVAILABLE'
	const isExpired =
		purchaseUserTransfer.expiresAt &&
		purchaseUserTransfer.expiresAt < new Date()

	switch (true) {
		case isNotAvailable:
			return false
		case isExpired:
			await courseBuilderAdapter.updatePurchaseUserTransferTransferState({
				id: purchaseUserTransfer.id,
				transferState: 'EXPIRED',
			})
			return false
	}

	return true
}

type HTMLEmailParams = Record<'url' | 'host' | 'email', string> & {
	expires?: Date
}

async function defaultHtml(
	{ url, host, email }: HTMLEmailParams,
	theme?: Theme,
) {
	return await render(
		PurchaseTransferEmail(
			{
				url,
				host,
				email,
				siteName:
					process.env.NEXT_PUBLIC_PRODUCT_NAME ||
					process.env.NEXT_PUBLIC_SITE_TITLE ||
					'',
				previewText: 'Claim your seat.',
			},
			theme,
		),
	)
}

// Email Text body (fallback for email clients that don't render HTML, e.g. feature phones)
async function defaultText(
	{ url, host, email }: HTMLEmailParams,
	theme?: Theme,
) {
	return await render(
		PurchaseTransferEmail(
			{
				url,
				host,
				email,
				siteName:
					process.env.NEXT_PUBLIC_PRODUCT_NAME ||
					process.env.NEXT_PUBLIC_SITE_TITLE ||
					'',
				previewText:
					process.env.NEXT_PUBLIC_PRODUCT_NAME ||
					process.env.NEXT_PUBLIC_SITE_TITLE ||
					'login link',
			},
			theme,
		),
		{
			plainText: true,
		},
	)
}
