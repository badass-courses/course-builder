'use client'

import * as React from 'react'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import Markdown from 'react-markdown'

import { type PurchaseData } from './purchase-data-provider'

export function AttendeeInstructions({
	attendeeInstructions,
	purchaseDataPromise,
}: {
	attendeeInstructions: string | null
	purchaseDataPromise: Promise<PurchaseData>
}) {
	const { hasPurchasedCurrentProduct } = React.use(purchaseDataPromise)

	if (!attendeeInstructions || !hasPurchasedCurrentProduct) {
		return null
	}

	return (
		<div className="dark:bg-card dark:border-foreground/10 mb-8 flex flex-col gap-1 rounded-md border bg-white p-6 text-left font-medium shadow-xl">
			<p className="inline-flex items-center font-semibold">
				<DocumentTextIcon className="mr-1 size-5 text-teal-600 dark:text-teal-400" />{' '}
				Attendee Instructions
			</p>
			<Markdown className="prose dark:prose-invert mt-2">
				{attendeeInstructions}
			</Markdown>
		</div>
	)
}
