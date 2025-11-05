import React from 'react'
import { AlertTriangle, Check } from 'lucide-react'

/**
 * Component to display when payment succeeded but Inngest failed to process it.
 * This provides a user-friendly message instead of a 404 error.
 * Will be used by all apps - purchase pages for consistent error handling.
 */
export function PaymentSuccessButProcessingFailed({
	supportEmail,
}: {
	supportEmail: string
}) {
	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-10 text-center">
			<div className="flex flex-col items-center gap-5">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
					<Check className="h-8 w-8" />
				</div>

				<div>
					<h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
						Payment Successful!
					</h1>
					<p className="text-base text-zinc-600 dark:text-zinc-400">
						Your payment has been processed successfully.
					</p>
				</div>
			</div>

			<div className="mx-auto w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:[box-shadow:0_0_0_1px_rgba(255,255,255,0.03)_inset]">
				<div className="mb-4 flex items-start gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-1 dark:ring-amber-400/20">
						<AlertTriangle className="h-5 w-5" />
					</div>
					<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
						Processing Issue Detected
					</h3>
				</div>

				<div className="space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
					<p>
						We're experiencing a temporary issue while setting up your purchase.
					</p>

					<p>
						If you haven't received a confirmation email after 20–30 minutes,
						please reach out to us at{' '}
						<a
							href={`mailto:${supportEmail}`}
							className="rounded-sm font-medium text-amber-700 underline decoration-amber-300/70 underline-offset-2 hover:text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 dark:text-amber-300 dark:decoration-amber-400/60 dark:hover:text-amber-200"
						>
							{supportEmail}
						</a>{' '}
						and we'll help as soon as possible.
					</p>

					<p>
						We're sorry for the inconvenience — we'll make sure everything gets
						sorted quickly.
					</p>
				</div>
			</div>
		</div>
	)
}
