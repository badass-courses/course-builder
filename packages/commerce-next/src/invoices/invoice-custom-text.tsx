'use client'

import * as React from 'react'
import { useLocalStorage } from 'react-use'

import { Textarea } from '@coursebuilder/ui'

import { cn } from '../cn'

export function InvoiceCustomText({ className }: { className?: string }) {
	const [invoiceMetadata, setInvoiceMetadata] = useLocalStorage(
		'invoice-metadata',
		'',
	)
	return (
		<>
			<Textarea
				aria-label="Invoice notes"
				className={cn(
					'my-2 h-full w-full p-3 print:my-0 print:hidden print:border-none print:bg-transparent print:p-0 print:text-base',
					{
						'print:hidden': invoiceMetadata?.trim() === '',
					},
					className,
				)}
				value={invoiceMetadata}
				onChange={(e) => setInvoiceMetadata(e.target.value)}
				placeholder="Enter additional info here (optional)"
			/>
			<div className="hidden print:block">{invoiceMetadata}</div>
		</>
	)
}
