'use client'

import * as React from 'react'
import { DownloadIcon } from 'lucide-react'

export function InvoicePrintButton() {
	return (
		<button
			onClick={() => {
				window.print()
			}}
			className="bg-primary flex items-center rounded-md px-3 py-2 text-sm font-semibold leading-6 text-white transition-colors duration-200 ease-in-out"
		>
			<span className="pr-2">Download PDF or Print</span>
			<DownloadIcon aria-hidden="true" className="w-5" />
		</button>
	)
}
