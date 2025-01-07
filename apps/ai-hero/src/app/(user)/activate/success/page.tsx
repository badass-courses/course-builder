import * as React from 'react'
import { Icon } from '@/components/icons'
import Balancer from 'react-wrap-balancer'

export default function ActivateSuccess() {
	return (
		<main className="mx-auto flex w-full max-w-lg flex-grow flex-col items-center justify-center pb-24 pt-16">
			<div className="flex w-full flex-col items-center rounded p-5 text-center">
				<Icon
					name="Checkmark"
					className="mb-5 h-8 w-8 text-emerald-500 dark:text-emerald-300"
				/>
				<h1 className="text-2xl font-bold sm:text-3xl">
					Device Activation Successful
				</h1>
				<p className="py-4 text-gray-600 dark:text-gray-400">
					<Balancer>
						You're now logged in to the app. You can close this page.
					</Balancer>
				</p>
			</div>
		</main>
	)
}
