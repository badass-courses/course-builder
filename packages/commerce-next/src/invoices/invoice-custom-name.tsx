'use client'

import * as React from 'react'
import { useLocalStorage } from 'react-use'

import { Input, Textarea } from '@coursebuilder/ui'

export function InvoiceCustomName({
	defaultName,
	id = 'invoice-name',
}: {
	defaultName: string
	id?: string
}) {
	const [invoiceName, setInvoiceName] = useLocalStorage(id, defaultName)
	return (
		<>
			<Textarea
				className="my-2 h-full w-full p-3 print:my-0 print:hidden print:border-none print:bg-transparent print:p-0 print:text-base"
				aria-label="Invoice recipient name"
				value={invoiceName}
				onChange={(e) => setInvoiceName(e.target.value)}
				placeholder="Enter name"
			/>
			<div className="hidden print:block">{invoiceName}</div>
		</>
	)
}
