import { isSameDay } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

interface CohortDateRange {
	dateString: string | null
	timeString: string | null
}

/**
 * Formats cohort start and end dates into user-friendly strings.
 *
 * @param startsAt - The start date/time string (ISO 8601 or compatible).
 * @param endsAt - The end date/time string (ISO 8601 or compatible).
 * @param timezone - The IANA timezone string (e.g., 'America/Los_Angeles'). Defaults to 'America/Los_Angeles'.
 * @returns An object containing formatted dateString and timeString.
 */
export function formatCohortDateRange(
	startsAt: string | null | undefined,
	endsAt: string | null | undefined,
	timezone?: string | null | undefined,
): CohortDateRange {
	const tz = timezone || 'America/Los_Angeles'
	let dateString: string | null = null
	let timeString: string | null = null

	if (startsAt) {
		const startDate = new Date(startsAt)
		if (endsAt) {
			const endDate = new Date(endsAt)
			if (isSameDay(startDate, endDate)) {
				// Same day event: "Month Day, Year" | "Start Time - End Time (Timezone)"
				dateString = formatInTimeZone(startDate, tz, 'MMMM d, yyyy')
				timeString = `${formatInTimeZone(
					startDate,
					tz,
					'h:mm a',
				)} — ${formatInTimeZone(endDate, tz, 'h:mm a zzz')}`
			} else {
				// Multi-day event: check if same year for formatting
				const startYear = formatInTimeZone(startDate, tz, 'yyyy')
				const endYear = formatInTimeZone(endDate, tz, 'yyyy')

				if (startYear === endYear) {
					// Same year: "Start Month Day—End Month Day, Year"
					dateString = `${formatInTimeZone(
						startDate,
						tz,
						'MMMM d',
					)}—${formatInTimeZone(endDate, tz, 'MMMM d, yyyy')}`
				} else {
					// Different years: "Start Month Day, Year—End Month Day, Year"
					dateString = `${formatInTimeZone(
						startDate,
						tz,
						'MMMM d, yyyy',
					)}—${formatInTimeZone(endDate, tz, 'MMMM d, yyyy')}`
				}
				timeString = `${formatInTimeZone(startDate, tz, 'h:mm a zzz')}`
			}
		} else {
			// Only start date: "Month Day, Year" | "Start Time (Timezone)"
			dateString = formatInTimeZone(startDate, tz, 'MMMM d, yyyy')
			timeString = formatInTimeZone(startDate, tz, 'h:mm a zzz')
		}
	}

	return { dateString, timeString }
}
