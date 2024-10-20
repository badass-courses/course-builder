'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { XCircleIcon } from '@heroicons/react/24/solid'
import Balancer from 'react-wrap-balancer'

export default function ActivateFailure() {
	const searchParams = useSearchParams()

	const message = searchParams.get('message') || 'Unable to verify.'

	return (
		<Layout>
			<main className="mx-auto flex w-full max-w-lg flex-grow flex-col items-center justify-center pb-24 pt-16">
				<div className="flex w-full flex-col items-center rounded p-5 text-center">
					<XCircleIcon className="mb-5 h-10 w-10 text-rose-600 dark:text-rose-400" />
					<h1 className="text-2xl font-bold sm:text-3xl">
						Device Activation Failed
					</h1>
					<p className="w-full py-4 text-gray-600 dark:text-gray-400">
						<Balancer>{message} Please try again.</Balancer>
					</p>
				</div>
			</main>
		</Layout>
	)
}
