import * as React from 'react'
import Link from 'next/link'
import { DocumentTextIcon } from '@heroicons/react/24/solid'
import { format } from 'date-fns'
import { ChevronRightIcon } from 'lucide-react'

import { Purchase } from '@coursebuilder/core/schemas'

export const InvoiceCard: React.FC<{ purchase: Purchase | any }> = ({
	purchase,
}) => {
	return (
		<div className="bg-card flex flex-col items-start justify-between rounded-lg border border-gray-700/30 p-5 shadow-xl shadow-black/10 sm:flex-row sm:items-center">
			<div className="flex w-full gap-2">
				<div>
					<DocumentTextIcon aria-hidden className="w-6 text-gray-500" />
				</div>
				<div>
					<h2 className="text-lg font-semibold leading-tight">
						Invoice: {purchase.product.name}
					</h2>
					<div className="flex pt-2 text-sm text-gray-400 sm:pt-1">
						<span className="after:content-['・']">
							{Intl.NumberFormat('en-US', {
								style: 'currency',
								currency: 'USD',
							}).format(purchase.totalAmount)}
						</span>
						<span>{format(new Date(purchase.createdAt), 'MMMM d, y')}</span>
					</div>
				</div>
			</div>
			<Link
				href={`/invoices/${purchase.merchantChargeId}`}
				className="ml-8 mt-5 flex flex-shrink-0 items-center justify-end rounded-md bg-gray-300/20 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-400/30 sm:ml-0 sm:mt-0 sm:justify-center"
			>
				<span className="pr-0.5">View Invoice</span>
				<ChevronRightIcon aria-hidden="true" className="w-4" />
			</Link>
		</div>
	)
}
