'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { XCircleIcon } from '@heroicons/react/24/solid'
import Balancer from 'react-wrap-balancer'

export default function ActivateFailure() {
	return (
		<LayoutClient withContainer>
			<main className="mx-auto flex w-full max-w-lg grow flex-col items-center justify-center pb-24 pt-16">
				<div className="flex w-full flex-col items-center rounded p-5 text-center">
					<XCircleIcon className="mb-5 h-10 w-10 text-rose-600 dark:text-rose-400" />
					<h1 className="text-2xl font-bold sm:text-3xl">
						Device Activation Failed
					</h1>
					<p className="w-full py-4 text-gray-600 dark:text-gray-400">
						<React.Suspense>
							<Message />
						</React.Suspense>
					</p>
				</div>
			</main>
		</LayoutClient>
	)
}

function Message() {
	const searchParams = useSearchParams()

	const message = searchParams.get('message') || 'Unable to verify.'
	return <Balancer>{message} Please try again.</Balancer>
}
