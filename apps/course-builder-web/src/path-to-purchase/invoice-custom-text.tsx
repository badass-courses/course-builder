'use client'

import * as React from 'react'
import { useLocalStorage } from 'react-use'

export function InvoiceCustomText() {
	const [invoiceMetadata, setInvoiceMetadata] = useLocalStorage(
		'invoice-metadata',
		'',
	)
	return (
		<>
			<textarea
				aria-label="Invoice notes"
				className="form-textarea border-primary mt-4 h-full w-full rounded-md border-2 bg-gray-50 p-3 placeholder-gray-700 print:hidden print:border-none print:bg-transparent print:p-0"
				value={invoiceMetadata}
				onChange={(e) => setInvoiceMetadata(e.target.value)}
				placeholder="Enter additional info here (optional)"
			/>
			<div className="hidden print:block">{invoiceMetadata}</div>
		</>
	)
}
