import process from 'process'
import { emailProvider } from '@/coursebuilder/email-provider'
import { courseBuilderAdapter, db } from '@/db'
import {
	merchantCharge,
	merchantCustomer,
	purchases as purchaseTable,
	purchaseUserTransfer as purchaseUserTransferTable,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { authOptions, getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { Theme } from '@auth/core/types'
import { format } from 'date-fns'
import { and, eq, gte } from 'drizzle-orm'
import { Inngest } from 'inngest'
import mjml2html from 'mjml'
import type { NextAuthConfig } from 'next-auth'
import Stripe from 'stripe'
import { v4 } from 'uuid'
import { z } from 'zod'

import { PURCHASE_TRANSFERRED_EVENT } from '@coursebuilder/core/inngest/purchase-transfer/event-purchase-transferred'
import { sendServerEmail } from '@coursebuilder/core/lib/send-server-email'
import { PurchaseUserTransfer } from '@coursebuilder/core/schemas'

const stripe = new Stripe(env.STRIPE_SECRET_TOKEN!, {
	apiVersion: '2020-08-27',
})

const canInitiateTransfer = async ({
	purchaseUserTransfer,
}: {
	purchaseUserTransfer: PurchaseUserTransfer | null
}) => {
	if (!purchaseUserTransfer) {
		return false
	}

	const { updatePurchaseUserTransferTransferState } = courseBuilderAdapter

	const isNotAvailable = purchaseUserTransfer.transferState !== 'AVAILABLE'
	const isExpired =
		purchaseUserTransfer.expiresAt &&
		purchaseUserTransfer.expiresAt < new Date()

	switch (true) {
		case isNotAvailable:
			return false
		case isExpired:
			await updatePurchaseUserTransferTransferState({
				id: purchaseUserTransfer.id,
				transferState: 'EXPIRED',
			})
			return false
	}

	return true
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
	const { getPurchaseUserTransferById, findOrCreateUser } = courseBuilderAdapter
	const { user: toUser } = await findOrCreateUser(toEmail.toLowerCase())
	const purchaseUserTransfer = await getPurchaseUserTransferById({
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

export const purchaseUserTransferRouter = createTRPCRouter({
	initiate: publicProcedure
		.input(
			z.object({
				purchaseUserTransferId: z.string(),
				email: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { getPurchaseUserTransferById } = courseBuilderAdapter
			const purchaseUserTransfer = await getPurchaseUserTransferById({
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
		}),
	cancel: publicProcedure
		.input(
			z.object({
				purchaseUserTransferId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { getPurchaseUserTransferById } = courseBuilderAdapter
			const purchaseUserTransfer = await getPurchaseUserTransferById({
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

			return await db.query.purchaseUserTransfer.findFirst({
				where: eq(purchaseUserTransferTable.id, newPutId),
			})
		}),
	accept: publicProcedure
		.input(
			z.object({
				purchaseUserTransferId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const token = await getServerAuthSession()
			const {
				updatePurchaseUserTransferTransferState,
				getPurchaseUserTransferById,
				getUserById,
			} = courseBuilderAdapter
			const purchaseUserTransfer = await getPurchaseUserTransferById({
				id: input.purchaseUserTransferId,
			})
			const user = token
				? await getUserById(token.session?.user.id as string)
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
				const existingCustomer = (await stripe.customers.retrieve(
					identifier,
				)) as Stripe.Response<Stripe.Customer>

				await stripe.customers.update(identifier, {
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
		}),
	byId: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { getPurchaseUserTransferById } = courseBuilderAdapter
			return await getPurchaseUserTransferById({
				id: input.id,
			})
		}),
	forPurchaseId: publicProcedure
		.input(
			z.object({
				id: z.string().optional(),
				sourceUserId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const token = await getServerAuthSession()
			if (!token && !input.sourceUserId) {
				return []
			}

			await db.query.purchaseUserTransfer.findMany({
				where: and(
					eq(
						purchaseUserTransferTable.sourceUserId,
						token?.session?.user.id as string,
					),
					eq(purchaseUserTransferTable.purchaseId, input.id as string),
					gte(purchaseUserTransferTable.expiresAt, new Date()),
				),
			})
		}),
})

export type HTMLEmailParams = Record<'url' | 'host' | 'email', string> & {
	expires?: Date
}
export type TextEmailParams = Record<'url' | 'host', string> & {
	expires?: Date
}

function defaultHtml(
	{ url, host, email, expires }: HTMLEmailParams,
	theme: Theme,
) {
	// Insert invisible space into domains and email address to prevent both the
	// email address and the domain from being turned into a hyperlink by email
	// clients like Outlook and Apple mail, as this is confusing because it seems
	// like they are supposed to click on their email address to sign in.
	const escapedEmail = `${email.replace(/\./g, '&#8203;.')}`
	const escapedHost = `${host.replace(/\./g, '&#8203;.')}`

	// Some simple styling options
	const backgroundColor = '#F9FAFB'
	const textColor = '#3E3A38'
	const mainBackgroundColor = '#ffffff'
	const buttonBackgroundColor = theme ? theme.brandColor : '#F9FAFB'
	const buttonTextColor = '#ffffff'

	// use datefns to format the expiration date with Pacific timezone
	const formattedExpires = expires ? format(expires, 'PPPPppp') : null

	let expiresText = `        <mj-text color='${textColor}' align='center'  padding='30px 90px 10px 90px'>
          The link is valid for 24 hours or until it is used once. You will stay logged in for 60 days. <a href='${process.env.NEXT_PUBLIC_URL}/login' target='_blank'>Click here to request another link</a>.
        </mj-text>`

	if (formattedExpires) {
		expiresText = `        <mj-text color='${textColor}' align='center'  padding='30px 90px 10px 90px'>
          This link is valid until ${formattedExpires}.
        </mj-text>`
	}

	const { html } = mjml2html(`
<mjml>
  <mj-head>
    <mj-font name='Inter' href='https://fonts.googleapis.com/css2?family=Inter:wght@400;600' />
    <mj-attributes>
      <mj-all font-family='Inter, Helvetica, sans-serif' line-height='1.5' />
    </mj-attributes>
    <mj-raw>
      <meta name='color-scheme' content='light' />
      <meta name='supported-color-schemes' content='light' />
    </mj-raw>
  </mj-head>
  <mj-body background-color='${backgroundColor}'>
    ${
			theme?.logo &&
			`<mj-section padding='10px 0 10px 0'>
          <mj-column background-color='${backgroundColor}'>
            <mj-image alt='${process.env.NEXT_PUBLIC_SITE_TITLE}' width='180px' src='${theme.logo}' />
          </mj-column>
        </mj-section>`
		}
    <mj-section padding-top='0'>
      <mj-column background-color='${mainBackgroundColor}' padding='16px 10px'>
        <mj-text font-size='18px' color='${textColor}' align='center' padding-bottom='20px'>
          Accept your license <strong color='${textColor}'>${escapedEmail}</strong> for ${
						process.env.NEXT_PUBLIC_SITE_TITLE
					}.
        </mj-text>
        <mj-button href='${url}' background-color='${buttonBackgroundColor}' color='${buttonTextColor}' target='_blank' border-radius='6px' font-size='18px' font-weight='bold'>
          Accept License
        </mj-button>

        ${expiresText}
        <mj-text color='${textColor}' align='center' padding='10px 90px 10px 90px'>
          If you need additional help, reply!
        </mj-text>
        <mj-text color='gray' align='center' padding-top='40px'>
          If this email is unexpected you can safely ignore it.
        </mj-text>
    </mj-section>
  </mj-body>
</mjml>
`)

	return html
}

// Email Text body (fallback for email clients that don't render HTML, e.g. feature phones)
function defaultText({ url, host, expires }: TextEmailParams) {
	const formattedExpires = expires ? format(expires, 'PPPPppp') : null

	return `Log in to ${host}\n${url}\n\nexpires at ${formattedExpires}`
}
