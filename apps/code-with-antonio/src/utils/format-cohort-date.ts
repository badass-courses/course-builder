import { isSameDay } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

interface CohortDateRange {
	dateString: string | null
	timeString: string | null
	startsAt: string | null
}

/**
 * Maps IANA timezone identifiers to readable timezone names.
 * Returns consistent values between server and client to avoid hydration mismatches.
 */
const TIMEZONE_DISPLAY_NAMES: Record<string, string> = {
	'America/Los_Angeles': 'PT',
	'America/Denver': 'MT',
	'America/Chicago': 'CT',
	'America/New_York': 'ET',
	'Europe/London': 'GMT',
	'Europe/Paris': 'CET',
	'Asia/Tokyo': 'JST',
	'Australia/Sydney': 'AEDT',
	UTC: 'UTC',
}

/**
 * Gets a readable timezone abbreviation from an IANA timezone identifier.
 * Falls back to numeric offset if timezone is not in the map.
 */
function getTimezoneDisplay(date: Date, timezone: string): string {
	return (
		TIMEZONE_DISPLAY_NAMES[timezone] || formatInTimeZone(date, timezone, 'XXX')
	)
}

/**
 * Formats cohort start and end dates into user-friendly strings.
 *
 * @param startsAt - The start date/time string (ISO 8601 or compatible).
 * @param endsAt - The end date/time string (ISO 8601 or compatible).
 * @param timezone - The IANA timezone string (e.g., 'America/Los_Angeles'). Defaults to user's browser timezone if available, otherwise 'America/Los_Angeles'.
 * @returns An object containing formatted dateString and timeString.
 */
export function formatCohortDateRange(
	startsAt: string | null | undefined,
	endsAt: string | null | undefined,
	timezone?: string | null | undefined,
): CohortDateRange {
	// Use user's browser timezone if available (client-side), otherwise fall back to provided timezone or PT
	const tz =
		timezone ||
		(typeof window !== 'undefined'
			? Intl.DateTimeFormat().resolvedOptions().timeZone
			: 'America/Los_Angeles')
	let dateString: string | null = null
	let timeString: string | null = null
	let formattedStartsAt: string | null = null

	if (startsAt) {
		const startDate = new Date(startsAt)
		const tzDisplay = getTimezoneDisplay(startDate, tz)
		formattedStartsAt = `${formatInTimeZone(startDate, tz, 'MMMM d, yyyy')} at ${formatInTimeZone(startDate, tz, 'h:mm a')} ${tzDisplay}`

		if (endsAt) {
			const endDate = new Date(endsAt)
			if (isSameDay(startDate, endDate)) {
				// Same day event: "Month Day, Year" | "Start Time - End Time (Timezone)"
				dateString = formatInTimeZone(startDate, tz, 'MMMM d, yyyy')
				const tzDisplay = getTimezoneDisplay(startDate, tz)
				timeString = `${formatInTimeZone(
					startDate,
					tz,
					'h:mm a',
				)} — ${formatInTimeZone(endDate, tz, 'h:mm a')} ${tzDisplay}`
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
				const tzDisplay = getTimezoneDisplay(startDate, tz)
				timeString = `${formatInTimeZone(startDate, tz, 'h:mm a')} ${tzDisplay}`
			}
		} else {
			// Only start date: "Month Day, Year" | "Start Time (Timezone)"
			dateString = formatInTimeZone(startDate, tz, 'MMMM d, yyyy')
			const tzDisplay = getTimezoneDisplay(startDate, tz)
			timeString = `${formatInTimeZone(startDate, tz, 'h:mm a')} ${tzDisplay}`
		}
	}

	return { dateString, timeString, startsAt: formattedStartsAt }
}
