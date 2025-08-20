'use client'

import { env } from '@/env.mjs'
import { track } from '@/utils/analytics'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { formatInTimeZone } from 'date-fns-tz'

import type { Product } from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

type LoginPromptProps = {
	lessonSlug: string
	moduleSlug: string
	workshopProduct?: Product | null
}

/**
 * Simple login prompt for unauthenticated embed access
 * Directs users to log in on the main site
 */
export function LoginPrompt({
	lessonSlug,
	moduleSlug,
	workshopProduct,
}: LoginPromptProps) {
	// Try to get parent URL for better callback experience
	let callbackUrl: string = `${window.location.origin}/workshops/${moduleSlug}/${lessonSlug}`

	try {
		// Try to access parent location (will work if same origin)
		if (window.parent !== window && window.parent.location.href) {
			callbackUrl = window.parent.location.href
		}
	} catch (e) {
		// Cross-origin - can't access parent, use document.referrer as fallback
		if (document.referrer && document.referrer !== window.location.href) {
			callbackUrl = document.referrer
		}
	}

	const loginUrl = `${env.NEXT_PUBLIC_URL}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
	const resourceUrl = workshopProduct
		? getResourcePath(workshopProduct.type, workshopProduct.fields.slug, 'view')
		: getResourcePath('workshop', moduleSlug, 'view')

	// Check if this is a cohort product with limited enrollment
	const { openEnrollment, closeEnrollment } = workshopProduct?.fields || {}
	const isLimitedCohort = Boolean(openEnrollment || closeEnrollment)

	// Calculate purchase deadline
	let purchaseDeadlineMessage = null
	if (isLimitedCohort && closeEnrollment) {
		const timezone = 'America/Los_Angeles' // Default timezone
		const now = new Date()
		const closesAt = new Date(closeEnrollment)

		if (closesAt > now) {
			const deadlineString = formatInTimeZone(
				closesAt,
				timezone,
				"MMM dd, yyyy 'at' h:mm a zzz",
			)
			purchaseDeadlineMessage = (
				<>
					Enrollment closes{' '}
					<strong className="font-medium">{deadlineString}</strong>
				</>
			)
		}
	}

	return (
		<div className="relative z-10 flex min-h-64 items-center justify-center p-8">
			<div className="w-full max-w-md p-8 text-center shadow-lg">
				<div className="mb-6">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-indigo-200/20 bg-indigo-200/10">
						<LockClosedIcon className="h-7 w-7 text-indigo-300" />
					</div>
					<h2 className="mb-2 text-xl font-semibold text-white">
						Access Required
					</h2>
					<p className="text-sm text-white/80">
						Log in or buy access to view this video.
					</p>
					{purchaseDeadlineMessage && (
						<p className="mt-1 text-sm text-white/80">
							{purchaseDeadlineMessage}
						</p>
					)}
				</div>

				<div className="space-y-3">
					<a
						href={resourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						onClick={() => {
							track('clicked: enroll now from login prompt', {
								lessonSlug,
								moduleSlug,
								context: 'embed',
							})
						}}
						className="from-primary block w-full rounded-lg bg-gradient-to-b to-indigo-600 px-4 py-3 font-medium text-white transition-colors duration-150 ease-out hover:brightness-95"
					>
						<span className="drop-shadow-sm">Enroll Now</span>
					</a>
					<a
						href={loginUrl}
						target="_blank"
						rel="noopener noreferrer"
						onClick={() => {
							track('clicked: embed login prompt', {
								lessonSlug,
								moduleSlug,
								context: 'embed',
							})
						}}
						className="block w-full rounded-lg border border-white/50 px-4 py-3 font-medium text-white transition-colors duration-150 ease-out hover:bg-white/10"
					>
						<span className="drop-shadow-sm">Log In to Restore Purchase</span>
					</a>
					{/* <p className="text-xs text-white/80">
						This will open the login page in a new tab
					</p> */}
				</div>
			</div>
		</div>
	)
}
