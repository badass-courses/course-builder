import * as React from 'react'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/brand/logo'
import LayoutClient from '@/components/layout-client'
import { courseBuilderAdapter, db } from '@/db'
import { coupon } from '@/db/schema'
import { env } from '@/env.mjs'
import {
	cancelPurchaseTransfer,
	getPurchaseTransferForPurchaseId,
	initiatePurchaseTransfer,
} from '@/purchase-transfer/purchase-transfer-actions'
import { format, fromUnixTime } from 'date-fns'
import { eq } from 'drizzle-orm'
import { ChevronLeft, MailIcon } from 'lucide-react'
import Stripe from 'stripe'

import { InvoiceCustomText } from '@coursebuilder/commerce-next/invoices/invoice-custom-text'
import { InvoicePrintButton } from '@coursebuilder/commerce-next/invoices/invoice-print-button'
import * as PurchaseTransfer from '@coursebuilder/commerce-next/post-purchase/purchase-transfer'
import { Button, Input } from '@coursebuilder/ui'

const stripe = new Stripe(env.STRIPE_SECRET_TOKEN!, {
	apiVersion: '2024-06-20',
})

async function getChargeDetails(merchantChargeId: string) {
	const { getProduct, getPurchaseForStripeCharge, getMerchantCharge } =
		courseBuilderAdapter

	const merchantCharge = await getMerchantCharge(merchantChargeId)

	if (merchantCharge && merchantCharge.identifier) {
		const charge = await stripe.charges.retrieve(merchantCharge.identifier, {
			expand: ['customer', 'refunds'],
		})

		const purchase = await getPurchaseForStripeCharge(merchantCharge.identifier)
		const bulkCoupon =
			purchase &&
			purchase.bulkCouponId &&
			(await db.query.coupon.findFirst({
				where: eq(coupon.id, purchase.bulkCouponId),
			}))

		const merchantSession = purchase?.merchantSessionId
			? await db.query.merchantSession.findFirst({
					where: (merchantSession, { eq }) =>
						eq(merchantSession.id, purchase.merchantSessionId as string),
				})
			: null

		let quantity = 1
		if (merchantSession?.identifier) {
			const checkoutSession = await stripe.checkout.sessions.retrieve(
				merchantSession?.identifier,
				{ expand: ['line_items'] },
			)

			quantity = checkoutSession.line_items?.data[0]?.quantity || 1
		} else if (bulkCoupon) {
			quantity = bulkCoupon.maxUses
		}

		const product = purchase?.productId
			? await getProduct(purchase?.productId)
			: null

		if (product && charge && purchase) {
			return {
				state: 'SUCCESS' as const,
				result: {
					product,
					charge,
					quantity,
					bulkCoupon,
					purchaseId: purchase?.id,
				},
			}
		}
	}

	return {
		state: 'FAILED' as const,
		error: 'Unable to lookup the charge and related entities',
	}
}

const Invoice = async (props: {
	params: Promise<{ merchantChargeId: string }>
}) => {
	const params = await props.params
	await headers()
	const chargeDetails = await getChargeDetails(params.merchantChargeId)

	if (chargeDetails?.state !== 'SUCCESS') {
		redirect('/invoices')
	}

	const purchaseUserTransfers = await getPurchaseTransferForPurchaseId({
		id: chargeDetails?.result?.purchaseId,
	})

	if (chargeDetails?.state !== 'SUCCESS') {
		return null
	}

	const { charge, product, bulkCoupon, quantity } = chargeDetails.result

	const customer = charge.customer as Stripe.Customer
	const formatUsd = (amount: number) => {
		return Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(amount)
	}
	const created = fromUnixTime(charge.created)
	const date = format(created, 'MMMM d, y')
	const amountRefunded = charge.amount_refunded / 100
	const amount = (charge.amount - charge.amount_refunded) / 100

	const instructorName = `${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`
	const productName = `${process.env.NEXT_PUBLIC_SITE_TITLE} by ${instructorName}`

	const emailData = `mailto:?subject=Invoice for ${product.name}&body=Invoice for ${product.name} purchase: ${`${env.NEXT_PUBLIC_URL}/invoices/${params.merchantChargeId}`}`

	return (
		<LayoutClient withContainer>
			<div className="container border-x px-5">
				<main className="max-w-(--breakpoint-md) mx-auto w-full">
					<div className="flex flex-col justify-between pb-5 pt-10 print:hidden">
						<Link
							href="/invoices"
							className="mb-5 inline-flex items-center gap-1 text-sm opacity-75 transition hover:opacity-100"
						>
							<ChevronLeft className="h-3 w-3" /> Invoices
						</Link>
						<h1 className="font-text text-center text-lg font-medium leading-tight sm:text-left sm:text-xl">
							Your Invoice for {product.name}
						</h1>
						<div className="flex flex-col items-center gap-2 pt-3 sm:flex-row">
							<Suspense>
								<InvoicePrintButton />
							</Suspense>
							{emailData && (
								<Button asChild variant="secondary">
									<a href={emailData}>
										<span className="pr-2">Send via email</span>
										<MailIcon aria-hidden="true" className="w-5" />
									</a>
								</Button>
							)}
						</div>
					</div>
					<div className="rounded-t-md border bg-white pr-12 text-gray-900 print:border-none print:shadow-none">
						<div className="px-10 py-16">
							<div className="flex w-full grid-cols-3 flex-col items-start justify-between gap-8 sm:grid sm:gap-0">
								<div className="col-span-2 flex items-center">
									<span className="font-text pl-2 text-2xl font-bold">
										<Logo className="w-40 text-black" />
									</span>
								</div>
								<div>
									<h2 className="mb-2 text-xs uppercase text-gray-500">From</h2>
									<span className="font-semibold">{productName}</span>
									<br />
									co Skill Recordings Inc.
									<br />
									12333 Sowden Rd
									<br />
									Ste. B, PMB #97429
									<br />
									Houston, TX 77080-2059
									<br />
									972-992-5951
								</div>
							</div>
							<div className="grid grid-cols-3 gap-5 pb-64">
								<div className="col-span-2">
									<p className="mb-2 text-2xl font-bold">Invoice</p>
									Invoice ID: <strong>{params.merchantChargeId}</strong>
									<br />
									Created: <strong>{date}</strong>
									<br />
									Status:{' '}
									<strong>
										{charge.status === 'succeeded'
											? charge.refunded
												? 'Refunded'
												: 'Paid'
											: 'Pending'}
									</strong>
								</div>
								<div className="pt-12">
									<h2 className="mb-2 text-xs uppercase text-gray-500">
										Invoice For
									</h2>
									<div>
										{/* <Input
										className="border-primary mb-1 h-8 border-2 p-2 text-base leading-none print:hidden"
										defaultValue={customer.name as string}
									/> */}
										{charge.billing_details.name}
										<br />
										{charge.billing_details.email}
										{/* <br />
                  {charge.billing_details.address?.city}
                  <br />
                  {charge.billing_details.address?.postal_code}
                  <br />
                  {charge.billing_details.address?.country} */}
									</div>
									<Suspense>
										<InvoiceCustomText />
									</Suspense>
								</div>
							</div>
							<h2 className="sr-only">Purchase details</h2>
							<table className="w-full table-auto text-left">
								<thead className="table-header-group">
									<tr className="table-row">
										<th scope="col">Description</th>
										<th scope="col">Unit Price</th>
										<th scope="col">Quantity</th>
										<th scope="col" className="text-right">
											Amount
										</th>
									</tr>
								</thead>
								<tbody>
									{quantity ? (
										<tr className="table-row">
											<td>{product.name}</td>
											<td>
												{charge.currency.toUpperCase()}{' '}
												{formatUsd(charge.amount / 100 / quantity)}
											</td>
											<td>{quantity}</td>
											<td className="text-right">
												{amount === null
													? `${charge.currency.toUpperCase()} 0.00`
													: `${charge.currency.toUpperCase()} ${formatUsd(
															amount + amountRefunded,
														)}`}
											</td>
										</tr>
									) : (
										<tr className="table-row">
											<td>{product.name}</td>
											<td>
												{charge.currency.toUpperCase()}{' '}
												{formatUsd(charge.amount / 100)}
											</td>
											<td>1</td>
											<td className="text-right">
												{amount === null
													? `${charge.currency.toUpperCase()} 0.00`
													: `${charge.currency.toUpperCase()} ${formatUsd(
															amount + amountRefunded,
														)}`}
											</td>
										</tr>
									)}
									{amountRefunded > 0 && (
										<tr className="table-row">
											<td className="text-red-600">Partial Refund</td>
											<td></td>
											<td></td>
											<td className="text-right text-red-600">
												{charge.currency.toUpperCase()} -
												{formatUsd(amountRefunded)}
											</td>
										</tr>
									)}
								</tbody>
							</table>
							<div className="flex flex-col items-end py-16">
								<div>
									<span className="mr-3">Total</span>
									<strong className="text-lg">
										{charge.currency.toUpperCase()} {formatUsd(amount)}
									</strong>
								</div>
							</div>
						</div>
					</div>
					{!bulkCoupon && purchaseUserTransfers.length > 0 ? (
						<div className="py-16 print:hidden">
							<div>
								<h2 className="text-primary pb-4 text-sm uppercase">
									Transfer this purchase to another email address
								</h2>
								<PurchaseTransfer.Root
									onTransferInitiated={async () => {
										'use server'
										revalidatePath(`/invoices/${params.merchantChargeId}`)
									}}
									purchaseUserTransfers={purchaseUserTransfers}
									cancelPurchaseTransfer={cancelPurchaseTransfer}
									initiatePurchaseTransfer={initiatePurchaseTransfer}
								>
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
					) : null}
				</main>
			</div>
		</LayoutClient>
	)
}

export default Invoice
