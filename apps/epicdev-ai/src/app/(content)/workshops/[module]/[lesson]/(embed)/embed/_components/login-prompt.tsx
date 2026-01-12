'use client'

import { env } from '@/env.mjs'
import type { Cohort } from '@/lib/cohort'
import { track } from '@/utils/analytics'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { formatInTimeZone } from 'date-fns-tz'

import type { Product } from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

type LoginPromptProps = {
	lessonSlug: string
	moduleSlug: string
	workshopProduct?: Product | null
	workshopResource?: {
		fields?: { startsAt?: string | null; timezone?: string }
	} | null
	cohortResource?: Cohort | null
	hasAccess?: boolean
	isAdmin?: boolean
}

/**
 * Simple login prompt for unauthenticated embed access
 * Directs users to log in on the main site
 */
export function LoginPrompt({
	lessonSlug,
	moduleSlug,
	workshopProduct,
	workshopResource,
	cohortResource,
	hasAccess = false,
	isAdmin = false,
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

	// Determine the correct resource URL based on product type and cohort availability
	let resourceUrl: string
	if (workshopProduct?.type === 'cohort' && cohortResource?.fields?.slug) {
		// For cohort products, use the cohort slug
		resourceUrl = `${env.NEXT_PUBLIC_URL}${getResourcePath(cohortResource.type, cohortResource.fields.slug, 'view')}`
	} else if (workshopProduct) {
		// For other products, use the product slug
		resourceUrl = `${env.NEXT_PUBLIC_URL}${getResourcePath(workshopProduct.type as string, workshopProduct.fields.slug, 'view')}`
	} else {
		// Fallback to workshop path
		resourceUrl = `${env.NEXT_PUBLIC_URL}${getResourcePath('workshop', moduleSlug, 'view')}`
	}

	// Check if this is a cohort product with limited enrollment
	const { openEnrollment, closeEnrollment } = workshopProduct?.fields || {}
	const isLimitedCohort = Boolean(openEnrollment || closeEnrollment)

	// Get workshop start date from workshop resource
	const startsAt = workshopResource?.fields?.startsAt

	// Calculate purchase deadline, enrollment status, and workshop start status
	let purchaseDeadlineMessage = null
	let enrollmentClosed = false
	let workshopNotStarted = false
	let workshopStartMessage = null

	// Use workshop timezone if available, fallback to default
	const timezone = workshopResource?.fields?.timezone || 'America/Los_Angeles'
	// Properly handle timezone comparison - get current time in workshop timezone to compare with stored dates
	const nowInTZ = new Date(
		formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
	)

	if (isLimitedCohort && closeEnrollment) {
		const closesAt = new Date(closeEnrollment)

		if (closesAt > nowInTZ) {
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
		} else {
			enrollmentClosed = true
		}
	}

	// Check if user has access but workshop hasn't started yet (admins bypass this check)
	if (hasAccess && startsAt && !isAdmin) {
		const startsAtDate = new Date(startsAt)
		if (startsAtDate > nowInTZ) {
			workshopNotStarted = true
			const startDateString = formatInTimeZone(
				startsAtDate,
				timezone,
				"MMM dd, yyyy 'at' h:mm a zzz",
			)
			workshopStartMessage = (
				<>
					Workshop starts{' '}
					<strong className="font-medium">{startDateString}</strong>
				</>
			)
		}
	}

	return (
		<div className="relative z-10 flex min-h-64 items-center justify-center p-8">
			<div className="w-full max-w-md p-8 text-center">
				<div className="mb-4">
					<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-indigo-200/20 bg-indigo-200/10">
						<LockClosedIcon className="h-5 w-5 text-indigo-300" />
					</div>
					<h2 className="mb-1 text-xl font-semibold text-white">
						{workshopNotStarted ? 'Workshop Not Opened Yet' : 'Access Required'}
					</h2>
					<p className="text-sm text-white/80">
						{workshopNotStarted
							? "You have access to this workshop, but it hasn't opened yet."
							: enrollmentClosed
								? 'This cohort has already started and is no longer accepting new enrollments.'
								: 'Log in or buy access to view this video.'}
					</p>
					{workshopStartMessage && (
						<p className="mt-1 text-sm text-white/80">{workshopStartMessage}</p>
					)}
					{purchaseDeadlineMessage && (
						<p className="mt-1 text-sm text-white/80">
							{purchaseDeadlineMessage}
						</p>
					)}
				</div>

				<div className="space-y-2">
					{workshopNotStarted ? (
						<>
							<a
								href={`${env.NEXT_PUBLIC_URL}${getResourcePath('workshop', moduleSlug, 'view')}`}
								target="_blank"
								rel="noopener noreferrer"
								onClick={() => {
									track('clicked: go to workshop from not opened yet', {
										lessonSlug,
										moduleSlug,
										context: 'embed',
									})
								}}
								className="from-primary block w-full rounded-lg bg-gradient-to-b to-indigo-600 px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:brightness-95"
							>
								<span className="drop-shadow-sm">Go to Workshop</span>
							</a>
						</>
					) : enrollmentClosed ? (
						<>
							<a
								href="/cohorts"
								target="_blank"
								rel="noopener noreferrer"
								onClick={() => {
									track(
										'clicked: view upcoming cohorts from closed enrollment',
										{
											lessonSlug,
											moduleSlug,
											context: 'embed',
										},
									)
								}}
								className="from-primary block w-full rounded-lg bg-gradient-to-b to-indigo-600 px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:brightness-95"
							>
								<span className="drop-shadow-sm">View Upcoming Cohorts</span>
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
								className="block w-full rounded-lg border border-white/50 px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:bg-white/10"
							>
								<span className="drop-shadow-sm">
									Log In to Restore Purchase
								</span>
							</a>
						</>
					) : (
						<>
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
								className="from-primary block w-full rounded-lg bg-gradient-to-b to-indigo-600 px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:brightness-95"
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
								className="block w-full rounded-lg border border-white/50 px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:bg-white/10"
							>
								<span className="drop-shadow-sm">
									Log In to Restore Purchase
								</span>
							</a>
						</>
					)}
					{/* <p className="text-xs text-white/80">
						This will open the login page in a new tab
					</p> */}
				</div>
			</div>
		</div>
	)
}
