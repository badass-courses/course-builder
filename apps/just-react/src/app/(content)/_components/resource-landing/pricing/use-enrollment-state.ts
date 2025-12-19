'use client'

import * as React from 'react'
import { formatInTimeZone } from 'date-fns-tz'

import type { Product } from '@coursebuilder/core/schemas'

/**
 * Enrollment state for cohort/live event products.
 */
export type EnrollmentStateType = 'open' | 'not-open' | 'closed' | 'started'

export type EnrollmentState = {
	type: EnrollmentStateType
	title?: string
	subtitle?: string
}

type UseEnrollmentStateOptions = {
	/** Product with enrollment dates */
	product?: Product | null
	/** Start date of the cohort/event */
	startsAt?: string | null
	/** End date of the cohort/event */
	endsAt?: string | null
	/** Timezone for date calculations - defaults to America/Los_Angeles */
	timezone?: string
	/** Whether a coupon bypasses sold out state */
	bypassSoldOut?: boolean
}

/**
 * Hook to determine enrollment state for cohort/live event products.
 *
 * Extracted from cohort-pricing-widget-container.tsx to enable reuse
 * across event and cohort pages.
 *
 * @returns Enrollment state with type, title, and subtitle for UI display
 */
export function useEnrollmentState({
	product,
	startsAt,
	endsAt,
	timezone,
	bypassSoldOut = false,
}: UseEnrollmentStateOptions): EnrollmentState {
	const [isClient, setIsClient] = React.useState(false)

	React.useEffect(() => {
		setIsClient(true)
	}, [])

	if (!product) {
		return { type: 'closed', title: 'Product not available' }
	}

	const tz = timezone || 'America/Los_Angeles'

	// Get current time in the specified timezone
	const nowInTz = new Date(
		formatInTimeZone(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
	)

	const { openEnrollment, closeEnrollment } = product.fields || {}

	// Check enrollment window
	const isOpenEnrollment = openEnrollment
		? new Date(openEnrollment) < nowInTz &&
			(closeEnrollment ? new Date(closeEnrollment) > nowInTz : true)
		: false

	// Check if enrollment hasn't opened yet
	const enrollmentNotOpenYet = openEnrollment
		? new Date(openEnrollment) > nowInTz
		: false

	// Check if cohort/event has actually started
	const hasStarted = startsAt ? new Date(startsAt) <= nowInTz : false

	// Format enrollment open date for display
	const enrollmentOpenDateString = openEnrollment
		? formatInTimeZone(
				new Date(openEnrollment),
				tz,
				"MMM dd, yyyy 'at' h:mm a zzz",
			)
		: null

	// Determine the current state
	if (bypassSoldOut || isOpenEnrollment) {
		return { type: 'open' }
	}

	if (enrollmentNotOpenYet) {
		return {
			type: 'not-open',
			title: `Enrollment opens ${enrollmentOpenDateString}`,
			subtitle: 'Join the waitlist to be notified when enrollment opens.',
		}
	}

	// Enrollment is closed
	return {
		type: 'closed',
		title: hasStarted ? 'This has already started' : 'Enrollment is closed',
		subtitle: hasStarted
			? 'You can still join the waitlist to be notified when the next session starts.'
			: 'Enrollment has closed. Join the waitlist to be notified when enrollment opens again.',
	}
}
