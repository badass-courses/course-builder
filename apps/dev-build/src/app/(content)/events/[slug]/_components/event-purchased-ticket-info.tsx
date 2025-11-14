'use client'

import * as React from 'react'
import Link from 'next/link'
import { type Event } from '@/lib/events'
import {
	CheckCircleIcon,
	DocumentCurrencyDollarIcon,
} from '@heroicons/react/24/outline'

import { cn } from '@coursebuilder/ui/utils/cn'

import { type PurchaseData } from './purchase-data-provider'

export function PurchasedTicketInfo({
	event,
	eventDate,
	IS_SERIES,
	purchaseDataPromise,
}: {
	event: Event
	eventDate: string | false
	IS_SERIES: boolean
	purchaseDataPromise: Promise<PurchaseData>
}) {
	const { hasPurchasedCurrentProduct, existingPurchase } =
		React.use(purchaseDataPromise)

	if (!hasPurchasedCurrentProduct) {
		return null
	}

	return (
		<div
			className={cn(
				'dark:border-b-foreground/10 flex flex-col gap-1 border-b p-6 text-left font-medium',
			)}
		>
			<p className="font-semibold">
				<CheckCircleIcon className="inline-block size-5 text-teal-600 dark:text-teal-400" />{' '}
				You have purchased a ticket{' '}
				{IS_SERIES ? 'to this event series' : 'to this event'}. See you on{' '}
				{eventDate}.
			</p>
			{existingPurchase?.merchantChargeId && (
				<p>
					<DocumentCurrencyDollarIcon className="text-primary inline-block size-5" />{' '}
					<Link
						className="text-primary underline underline-offset-2"
						href={`/invoices/${existingPurchase.merchantChargeId}`}
					>
						Invoice
					</Link>
				</p>
			)}
		</div>
	)
}
