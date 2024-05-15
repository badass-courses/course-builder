'use client'

import * as React from 'react'
import { useLocalStorage } from 'react-use'

import { Textarea } from '@coursebuilder/ui'

export function InvoiceCustomText() {
	const [invoiceMetadata, setInvoiceMetadata] = useLocalStorage(
		'invoice-metadata',
		'',
	)
	return (
		<>
			<Textarea
				aria-label="Invoice notes"
				className="mt-4 h-full w-full print:hidden print:border-none print:bg-transparent print:p-0"
				value={invoiceMetadata}
				onChange={(e) => setInvoiceMetadata(e.target.value)}
				placeholder="Enter additional info here (optional)"
			/>
			<div className="hidden print:block">{invoiceMetadata}</div>
		</>
	)
}
