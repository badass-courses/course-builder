import * as React from 'react'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { courseBuilderAdapter, db } from '@/db'
import { coupon } from '@/db/schema'
import { env } from '@/env.mjs'
import { InvoiceCustomText } from '@/path-to-purchase/invoice-custom-text'
import { InvoicePrintButton } from '@/path-to-purchase/invoice-print-button'
import { getPurchaseTransferForPurchaseId } from '@/purchase-transfer/purchase-transfer-actions'
import { PurchaseTransferStatus } from '@/purchase-transfer/purchase-transfer-status'
import { format, fromUnixTime } from 'date-fns'
import { eq } from 'drizzle-orm'
import { MailIcon } from 'lucide-react'
import Stripe from 'stripe'

const stripe = new Stripe(env.STRIPE_SECRET_TOKEN!, {
	apiVersion: '2020-08-27',
})

async function getChargeDetails(merchantChargeId: string) {
	const { getProduct, getPurchaseForStripeCharge, getMerchantCharge } =
		courseBuilderAdapter

	const merchantCharge = await getMerchantCharge(merchantChargeId)

	console.log('merchantCharge', merchantCharge)

	if (merchantCharge && merchantCharge.identifier) {
		const charge = await stripe.charges.retrieve(merchantCharge.identifier, {
			expand: ['customer'],
		})

		console.log('charge', charge)

		const purchase = await getPurchaseForStripeCharge(merchantCharge.identifier)
		const bulkCoupon =
			purchase &&
			purchase.bulkCouponId &&
			(await db.query.coupon.findFirst({
				where: eq(coupon.id, purchase.bulkCouponId),
			}))

		console.log('bulkCoupon', bulkCoupon)
		console.log('purchase', purchase)

		const merchantSession = purchase?.merchantSessionId
			? await db.query.merchantSession.findFirst({
					where: (merchantSession, { eq }) =>
						eq(merchantSession.id, purchase.merchantSessionId as string),
				})
			: null

		console.log('merchantSession', merchantSession)

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

		console.log({ charge, product, bulkCoupon, purchase, merchantSession })

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

const Invoice = async ({
	params,
}: {
	params: { merchantChargeId: string }
}) => {
	headers()
	const chargeDetails = await getChargeDetails(params.merchantChargeId)

	console.log('chargeDetails', chargeDetails)

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
	const amount = charge.amount / 100

	const instructorName = `${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME} ${process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}`
	const productName = `${process.env.NEXT_PUBLIC_SITE_TITLE} by ${instructorName}`

	const emailData = `mailto:?subject=Invoice for ${process.env.NEXT_PUBLIC_SITE_TITLE}&body=Invoice for ${process.env.NEXT_PUBLIC_HOST} purchase: ${`${env.COURSEBUILDER_URL}/invoices/${params.merchantChargeId}`}`

	return (
		<div>
			<main className="mx-auto max-w-screen-md">
				<div className="flex flex-col justify-between pb-5 pt-12 print:hidden">
					<h1 className="font-text text-lg font-bold leading-tight sm:text-xl">
						Your Invoice for {process.env.NEXT_PUBLIC_SITE_TITLE}
					</h1>
					<div className="flex flex-col items-center gap-2 pt-3 sm:flex-row">
						<Suspense>
							<InvoicePrintButton />
						</Suspense>
						{emailData && (
							<a
								href={emailData}
								className="flex items-center rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold leading-6 transition-colors duration-200 ease-in-out dark:bg-gray-800"
							>
								<span className="pr-2">Send via email</span>
								<MailIcon aria-hidden="true" className="w-5" />
							</a>
						)}
					</div>
				</div>
				<div className="rounded-t-md bg-white pr-12 text-gray-900 shadow-xl print:shadow-none">
					<div className="px-10 py-16">
						<div className="grid w-full grid-cols-3 items-start justify-between ">
							<div className="col-span-2 flex items-center">
								<span className="font-text pl-2 text-2xl font-bold">
									{process.env.NEXT_PUBLIC_SITE_TITLE}
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
						<div className="grid grid-cols-3 pb-64">
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
									{customer.name}
									<br />
									{customer.email}
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
														amount,
													)}`}
										</td>
									</tr>
								) : (
									<tr className="table-row">
										<td>{product.name}</td>
										<td>
											{charge.currency.toUpperCase()} {formatUsd(amount)}
										</td>
										<td>1</td>
										<td className="text-right">
											{amount === null
												? `${charge.currency.toUpperCase()} 0.00`
												: `${charge.currency.toUpperCase()} ${formatUsd(
														amount,
													)}`}
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
				{!bulkCoupon && purchaseUserTransfers ? (
					<div className="py-16 print:hidden">
						<PurchaseTransferStatus
							purchaseUserTransfers={purchaseUserTransfers}
							refetch={async () => {
								'use server'
								revalidatePath(`/invoices/${params.merchantChargeId}`)
								redirect(`/invoices/${params.merchantChargeId}`)
							}}
						/>
					</div>
				) : null}
			</main>
		</div>
	)
}

export default Invoice
