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
 * Checks if two dates are on the same calendar day in a specific timezone.
 * This is critical for correct display - we must compare dates in the DISPLAY timezone,
 * not the system timezone, to avoid off-by-one-day errors.
 */
function isSameDayInTimezone(
	date1: Date,
	date2: Date,
	timezone: string,
): boolean {
	const day1 = formatInTimeZone(date1, timezone, 'yyyy-MM-dd')
	const day2 = formatInTimeZone(date2, timezone, 'yyyy-MM-dd')
	return day1 === day2
}

/**
 * Formats cohort start and end dates into user-friendly strings.
 *
 * @param startsAt - The start date/time string (ISO 8601 or compatible).
 * @param endsAt - The end date/time string (ISO 8601 or compatible).
 * @param timezone - The IANA timezone string (e.g., 'America/Los_Angeles'). Defaults to 'America/Los_Angeles'.
 *                   IMPORTANT: Always pass an explicit timezone to avoid hydration mismatches.
 * @returns An object containing formatted dateString and timeString.
 */
export function formatCohortDateRange(
	startsAt: string | null | undefined,
	endsAt: string | null | undefined,
	timezone?: string | null | undefined,
	short: boolean = false,
): CohortDateRange {
	// Always use explicit timezone to avoid server/client hydration mismatches.
	// Default to PT if not provided - callers should always pass the cohort's timezone.
	const tz = timezone || 'America/Los_Angeles'
	let dateString: string | null = null
	let timeString: string | null = null
	let formattedStartsAt: string | null = null

	if (startsAt) {
		const startDate = new Date(startsAt)
		const tzDisplay = getTimezoneDisplay(startDate, tz)
		formattedStartsAt = `${formatInTimeZone(startDate, tz, short ? 'MMM d' : 'MMMM d')} at ${formatInTimeZone(startDate, tz, 'h:mm a')} ${tzDisplay}`

		if (endsAt) {
			const endDate = new Date(endsAt)
			// CRITICAL: Compare dates in the display timezone, not system timezone
			if (isSameDayInTimezone(startDate, endDate, tz)) {
				// Same day event: "Month Day, Year" | "Start Time - End Time (Timezone)"
				dateString = formatInTimeZone(startDate, tz, short ? 'MMM d' : 'MMMM d')
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
						short ? 'MMM d' : 'MMMM d',
					)}—${formatInTimeZone(endDate, tz, short ? 'MMM d' : 'MMMM d, yyyy')}`
				} else {
					// Different years: "Start Month Day, Year—End Month Day, Year"
					dateString = `${formatInTimeZone(
						startDate,
						tz,
						short ? 'MMM d' : 'MMMM d, yyyy',
					)}—${formatInTimeZone(endDate, tz, short ? 'MMM d' : 'MMMM d')}`
				}
				const tzDisplay = getTimezoneDisplay(startDate, tz)
				timeString = `${formatInTimeZone(startDate, tz, 'h:mm a')} ${tzDisplay}`
			}
		} else {
			// Only start date: "Month Day, Year" | "Start Time (Timezone)"
			dateString = formatInTimeZone(
				startDate,
				tz,
				short ? 'MMM d' : 'MMMM d, yyyy',
			)
			const tzDisplay = getTimezoneDisplay(startDate, tz)
			timeString = `${formatInTimeZone(startDate, tz, 'h:mm a')} ${tzDisplay}`
		}
	}

	return { dateString, timeString, startsAt: formattedStartsAt }
}
