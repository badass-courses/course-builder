import * as React from 'react'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import Spinner from '@/components/spinner'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import {
	cancelPurchaseTransfer,
	getPurchaseTransferForPurchaseId,
	initiatePurchaseTransfer,
} from '@/purchase-transfer/purchase-transfer-actions'
import { getServerAuthSession } from '@/server/auth'
import { FileText, Mail } from 'lucide-react'

import * as InvoiceTeaser from '@coursebuilder/commerce-next/invoices/invoice-teaser'
import * as LoginLink from '@coursebuilder/commerce-next/post-purchase/login-link'
import * as PurchaseSummary from '@coursebuilder/commerce-next/post-purchase/purchase-summary'
import * as PurchaseTransfer from '@coursebuilder/commerce-next/post-purchase/purchase-transfer'
import * as InviteTeam from '@coursebuilder/commerce-next/team/invite-team'
import { convertToSerializeForNextResponse } from '@coursebuilder/commerce-next/utils/serialize-for-next-response'
import { checkForPaymentSuccessWithoutPurchase } from '@coursebuilder/core'
import type { PurchaseInfo } from '@coursebuilder/core/schemas/purchase-info'
import {
	EXISTING_BULK_COUPON,
	INDIVIDUAL_TO_BULK_UPGRADE,
	NEW_BULK_COUPON,
	NEW_INDIVIDUAL_PURCHASE,
} from '@coursebuilder/core/schemas/purchase-type'
import { logger } from '@coursebuilder/core/utils/logger'
import { PaymentSuccessButProcessingFailed } from '@coursebuilder/ui'

export const maxDuration = 100

const getServerSideProps = async (session_id: string) => {
	const paymentProvider = stripeProvider

	if (!paymentProvider) {
		throw new Error('No payment provider found')
	}

	if (!session_id) {
		throw new Error(`No session_id found: ${session_id}`)
	}

	const maxRetries = 30
	const initialDelay = 100
	const maxDelay = 1000

	let retries = 0
	let delay = initialDelay

	while (retries < maxRetries) {
		try {
			const purchaseInfo = await paymentProvider.getPurchaseInfo(
				session_id,
				courseBuilderAdapter,
			)

			if (
				'error' in purchaseInfo &&
				purchaseInfo.error === 'paymentSucceededButProcessingFailed'
			) {
				return {
					paymentSucceededButProcessingFailed: true,
					stripeEventId: purchaseInfo.stripeEventId,
				}
			}

			const {
				email,
				chargeIdentifier,
				quantity: seatsPurchased,
				product: merchantProduct,
				purchaseType,
			} = purchaseInfo as PurchaseInfo

			const stripeProductName = merchantProduct.name

			const purchase =
				await courseBuilderAdapter.getPurchaseForStripeCharge(chargeIdentifier)

			logger.debug('purchase', { purchase })

			if (!purchase || !email) {
				const errorCheck = await checkForPaymentSuccessWithoutPurchase(
					session_id,
					courseBuilderAdapter,
				)

				if (errorCheck.shouldShowError) {
					return {
						paymentSucceededButProcessingFailed: true,
						stripeEventId: errorCheck.stripeEventId,
					}
				}

				throw new Error('Purchase or email not found')
			}

			const product = await courseBuilderAdapter.getProduct(purchase.productId)

			const redemptionsLeft =
				purchase.bulkCoupon &&
				purchase.bulkCoupon.maxUses > purchase.bulkCoupon.usedCount

			return {
				purchase: convertToSerializeForNextResponse(purchase),
				email,
				seatsPurchased,
				redemptionsLeft,
				purchaseType,
				bulkCouponId: purchase.bulkCoupon?.id || null,
				product: convertToSerializeForNextResponse(product) || null,
				stripeProductName,
			}
		} catch (error) {
			retries++
			console.log(
				`Error getting purchase info: ${error} ${retries}/${maxRetries}`,
			)
			await new Promise((resolve) => setTimeout(resolve, delay))
			delay = Math.min(delay * 2, maxDelay)
		}
	}

	notFound()
}

const LoginLinkComp: React.FC<{ email: string }> = ({ email }) => {
	return (
		<LoginLink.Root email={email} className="border-b pb-5">
			<LoginLink.Status />
			<LoginLink.Title />
			<LoginLink.CTA className="mt-4 inline-flex items-center gap-3">
				<div className="bg-primary/20 text-primary flex h-10 w-10 items-center justify-center rounded-full p-3">
					<Mail className="h-4 w-4" />
				</div>
				<span>
					Login link sent to: <strong className="font-semibold">{email}</strong>
				</span>
			</LoginLink.CTA>
			<LoginLink.Description className="text-sm opacity-75 sm:text-base" />
		</LoginLink.Root>
	)
}

export default async function ThanksPurchasePage(props: {
	searchParams: Promise<{ session_id: string; provider: string }>
}) {
	const searchParams = await props.searchParams
	await headers()

	const { session_id } = searchParams

	return (
		<Suspense fallback={<PageLoading />}>
			<PurchaseThanksPageLoaded session_id={session_id} />
		</Suspense>
	)
}

function PageLoading() {
	return (
		<LayoutClient withContainer>
			<main className="container min-h-[calc(100vh-var(--nav-height))] border-x px-5 py-8 sm:py-16">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
					<h1 className="text-center text-lg font-medium sm:text-xl lg:text-2xl">
						Validating Your Purchase, Hang Tight...
					</h1>
					<div className="mx-auto">
						<Spinner className="text-center" />
					</div>
				</div>
			</main>
		</LayoutClient>
	)
}

async function PurchaseThanksPageLoaded({
	session_id,
}: {
	session_id: string
}) {
	const token = await getServerAuthSession()

	const result = await getServerSideProps(session_id)

	if ('paymentSucceededButProcessingFailed' in result) {
		return (
			<LayoutClient withContainer>
				<main className="container min-h-[calc(100vh-var(--nav-height))] border-x px-5 py-8 sm:py-16">
					<PaymentSuccessButProcessingFailed
						supportEmail={env.NEXT_PUBLIC_SUPPORT_EMAIL}
					/>
				</main>
			</LayoutClient>
		)
	}

	const {
		purchase,
		email,
		seatsPurchased,
		purchaseType,
		bulkCouponId,
		product,
		stripeProductName,
		redemptionsLeft,
	} = result

	if (email === token?.session?.user?.email) {
		return redirect('/welcome?purchaseId=' + purchase.id)
	}

	const purchaseUserTransfers = await getPurchaseTransferForPurchaseId({
		id: purchase.id,
		sourceUserId: purchase.userId || undefined,
	})
	let description: React.ReactElement | null = null
	let title = `Thank you for purchasing ${stripeProductName}`
	let loginLink: React.ReactElement | null = null
	let inviteTeam: React.ReactElement | null = (
		<InviteTeam.Root
			disabled={!redemptionsLeft}
			purchase={purchase}
			className="flex flex-col gap-y-2"
		>
			<InviteTeam.SeatsAvailable className="[&_span]:font-semibold" />
			<p>Send the following invite link to your colleagues to get started:</p>
			<div className="flex items-center gap-2">
				<InviteTeam.InviteLink />
				<InviteTeam.CopyInviteLinkButton />
			</div>
			<p>You'll be able to claim a seat for yourself once you sign in.</p>
		</InviteTeam.Root>
	)

	switch (purchaseType) {
		case NEW_INDIVIDUAL_PURCHASE:
			loginLink = <LoginLinkComp email={email} />
			inviteTeam = null
			break
		case NEW_BULK_COUPON:
			description = (
				<>
					Your purchase is for <strong>{seatsPurchased}</strong> seat
					{seatsPurchased > 1 && 's'}. You can always add more seats later when
					your team grows.
				</>
			)
			loginLink = <LoginLinkComp email={email} />
			break
		case EXISTING_BULK_COUPON:
			title = `Thank you for purchasing more seats for ${
				product?.name || process.env.NEXT_PUBLIC_SITE_TITLE
			}!`
			description = (
				<>
					Your purchase is for <strong>{seatsPurchased}</strong> additional seat
					{seatsPurchased > 1 && 's'}. You can always add more seats later when
					your team grows.
				</>
			)

			break
		case INDIVIDUAL_TO_BULK_UPGRADE:
			title = `Thank you for purchasing more seats for ${
				product?.name || process.env.NEXT_PUBLIC_SITE_TITLE
			}!`
			description = (
				<>
					Your purchase is for <strong>{seatsPurchased}</strong> additional seat
					{seatsPurchased > 1 && 's'}. You can always add more seats later when
					your team grows.
				</>
			)

			break
	}
	return (
		<LayoutClient withContainer>
			<main className="container min-h-[calc(100vh-var(--nav-height))] border-x px-5 py-8 sm:py-16">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
					<PurchaseSummary.Root
						title={title}
						description={description}
						product={product}
						email={email}
					>
						<div className="flex flex-col items-center gap-10 sm:flex-row">
							<PurchaseSummary.ProductImage />
							<div className="flex w-full flex-col items-start">
								<PurchaseSummary.Status />
								<PurchaseSummary.Title />
								<PurchaseSummary.Description />
							</div>
						</div>
					</PurchaseSummary.Root>
					{inviteTeam && (
						<div className="border-b pb-5">
							<h2 className="text-primary pb-4 text-sm uppercase">
								Invite Team
							</h2>
							{inviteTeam}
						</div>
					)}
					{loginLink && loginLink}
					<div className="border-b pb-5">
						<h2 className="text-primary pb-4 text-sm uppercase">Invoice</h2>
						<InvoiceTeaser.Root
							className="flex w-full flex-row items-center justify-between sm:gap-10"
							purchase={{ product: { name: stripeProductName }, ...purchase }}
						>
							<InvoiceTeaser.Link className="flex w-full flex-col justify-between sm:flex-row sm:items-center">
								<InvoiceTeaser.Title className="inline-flex items-center gap-2">
									<FileText className="h-4 w-4 opacity-75" />
									<span className="underline">{stripeProductName}</span>
								</InvoiceTeaser.Title>
								<InvoiceTeaser.Metadata />
							</InvoiceTeaser.Link>
							<InvoiceTeaser.Link className="text-primary flex shrink-0 hover:underline" />
						</InvoiceTeaser.Root>
					</div>
					<div>
						<PurchaseTransfer.Root
							onTransferInitiated={async () => {
								'use server'
								revalidatePath('/thanks/purchase')
							}}
							purchaseUserTransfers={purchaseUserTransfers}
							cancelPurchaseTransfer={cancelPurchaseTransfer}
							initiatePurchaseTransfer={initiatePurchaseTransfer}
						>
							<PurchaseTransfer.Header />
							<PurchaseTransfer.Available>
								<PurchaseTransfer.Description />
								<PurchaseTransfer.Form>
									<PurchaseTransfer.InputLabel />
									<PurchaseTransfer.InputEmail />
									<PurchaseTransfer.SubmitButton />
								</PurchaseTransfer.Form>
							</PurchaseTransfer.Available>
							<PurchaseTransfer.Initiated>
								<PurchaseTransfer.Description />
								<PurchaseTransfer.Cancel />
							</PurchaseTransfer.Initiated>
							<PurchaseTransfer.Completed>
								<PurchaseTransfer.Description />
							</PurchaseTransfer.Completed>
						</PurchaseTransfer.Root>
					</div>
				</div>
			</main>
		</LayoutClient>
	)
}
