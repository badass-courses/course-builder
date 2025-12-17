'use client'

import React from 'react'
import type { Cohort } from '@/lib/cohort'
import { Provider } from '@/server/auth'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import type { Account } from '@auth/core/types'
import { formatInTimeZone } from 'date-fns-tz'
import { CheckIcon } from 'lucide-react'

import type { CohortPageProps } from './cohort-page-props'
import ConnectDiscordButton from './connect-discord-button'

export const CohortPurchasedMessage = ({
	cohort,
	userWithAccountsLoader,
	cohortPricingLoader,
	providers,
}: {
	cohort: Cohort
	userWithAccountsLoader: Promise<any & { accounts: Account[] }> | null
	cohortPricingLoader: Promise<CohortPageProps>
	providers: Record<string, Provider> | null
}) => {
	const { hasPurchasedCurrentProduct } = React.use(cohortPricingLoader)
	const discordProvider = providers?.discord

	// Check if cohort has actually started (different from enrollment status)
	const tz = cohort.fields.timezone || 'America/Los_Angeles'
	const nowInPT = new Date(
		formatInTimeZone(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
	)
	const hasStarted = cohort.fields.startsAt
		? new Date(cohort.fields.startsAt) <= nowInPT
		: false

	// Always use cohort's timezone for consistent server/client rendering
	const {
		dateString: eventDateString,
		timeString: eventTimeString,
		startsAt,
	} = formatCohortDateRange(cohort.fields.startsAt, cohort.fields.endsAt, tz)

	return hasPurchasedCurrentProduct ? (
		<div className="flex w-full flex-col items-center justify-between gap-3 border-b p-3 text-left sm:flex-row">
			<div className="flex items-baseline gap-2 text-sm">
				<CheckIcon className="text-primary size-4 shrink-0" /> You have
				purchased a ticket to this cohort.
				<br />
				{!hasStarted && ' Starting at ' + startsAt + '.'}
			</div>
			<React.Suspense fallback={null}>
				<ConnectDiscordButton
					userWithAccountsLoader={userWithAccountsLoader}
					discordProvider={discordProvider}
				/>
			</React.Suspense>
		</div>
	) : null
}
