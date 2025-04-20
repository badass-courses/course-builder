// == Wrapper functions to match original request signature ==

import { parse } from 'date-fns'
import { format, zonedTimeToUtc } from 'date-fns-tz'

// etz.ts - Core encoding/decoding logic based on user input

const toHex = (n: number) => Math.floor(n).toString(16)

/**
 * encode: date → "epoch_hex[,minutes_hex]"
 * Encodes a Date object into the EveryTimeZone 't' parameter format.
 * Note: Uses UTC components directly.
 * @param d The Date object to encode (represents a UTC instant).
 */
export const encodeT = (d: Date): string => {
	// Get the epoch for midnight UTC of the date's UTC day
	const midnightUTCms = Date.UTC(
		d.getUTCFullYear(),
		d.getUTCMonth(),
		d.getUTCDate(),
	)
	const midnightUTCsecs = midnightUTCms / 1000

	// Get the total milliseconds for the specific instant
	const instantMs = d.getTime()

	// Calculate minutes past midnight UTC for this instant
	const minsPastUtc = Math.floor((instantMs - midnightUTCms) / 60000)

	const base = toHex(midnightUTCsecs) // seconds → hex
	return minsPastUtc ? `${base},${toHex(minsPastUtc)}` : base
}

/**
 * decode: "hex[,hex]" → Date in local tz (or supplied tz)
 * Decodes an EveryTimeZone 't' parameter string into a Date object.
 * @param t The 't' parameter string (e.g., "68195100,3a2").
 * @param tz Target timezone offset from UTC in minutes (e.g., -420 for PDT). Defaults to system's current offset.
 */
export const decodeT = (
	t: string,
	tz: number = new Date().getTimezoneOffset() * -1, // default to *current* system offset
): Date => {
	const [epochHex = '0', minsHex = '0'] = t.split(',')
	const midnightUTCms = parseInt(epochHex, 16) * 1000 // ms
	const minsPastUtc = parseInt(minsHex, 16)
	const instantUTCms = midnightUTCms + minsPastUtc * 60000

	// The result of Date constructor is ms since epoch UTC.
	// To represent this instant *in a specific timezone*, we adjust.
	// However, creating `new Date(instantUTCms)` already represents the correct UTC instant.
	// The `tz` parameter seems intended to shift the *output representation*, not the underlying instant.
	// Standard `Date` objects don't inherently store timezone, their methods use system locale.
	// Returning the Date object for the UTC instant. Formatting it is separate.
	// The user's provided code `new Date(epoch + mins + tz * 60000)` seems incorrect as it modifies the UTC instant.
	return new Date(instantUTCms)
}

/**
 * helpers if you're lazily handing urls around:
 */
export const extractParam = (url: string): string => {
	const match = url.match(/[?&\/]t=([\da-f,]+)/i)

	// Check if match exists and group 1 is defined and a non-empty string
	if (match && match[1] && typeof match[1] === 'string') {
		return match[1]
	}

	throw new Error('no t param value found in url')
}

const PACIFIC = 'America/Los_Angeles'
const BASE_URL = 'https://everytimezone.com/'

// NOTE: date-fns parse requires 'do' for ordinal day, not just 'd'
const LOCAL_FMT = 'MMMM do, yyyy h:mm a' // e.g. "May 6th, 2025 8:30 AM"

/** pacific strings → everytimezone link */
export function buildEtzLink(dateStr: string, timeStr: string): string {
	// Still need date-fns & tz to parse local string -> UTC Date
	const combinedStr = `${dateStr} ${timeStr}`
	// Use a fixed reference date for parsing to avoid potential ambient date issues
	const referenceDate = new Date(2000, 0, 1, 0, 0, 0, 0)
	const parsedDate = parse(combinedStr, LOCAL_FMT, referenceDate)

	if (isNaN(parsedDate.getTime())) {
		throw new Error(
			`Invalid date/time string provided: "${combinedStr}" with format "${LOCAL_FMT}"`,
		)
	}

	// Interpret parsed date as Pacific and convert to UTC instant Date object
	const utcDate = zonedTimeToUtc(parsedDate, PACIFIC)

	// Encode the UTC Date object using the new core logic
	const tParam = encodeT(utcDate)

	return `${BASE_URL}?t=${tParam}`
}

/** utc epoch seconds → link */
export function buildEtzLinkFromEpoch(epochSecsUtc: number): string {
	// Convert epoch seconds to UTC Date object
	const d = new Date(epochSecsUtc * 1000)

	// Use the same logic as encodeT for consistency
	const year = d.getUTCFullYear()
	const month = d.getUTCMonth()
	const day = d.getUTCDate()
	const midnightUTCms = Date.UTC(year, month, day)
	const midnightUTCsecs = Math.floor(midnightUTCms / 1000) // Ensure integer seconds

	const instantMs = d.getTime()
	const minsPastUtc = Math.floor((instantMs - midnightUTCms) / 60000)

	const hMid = toHex(midnightUTCsecs) // Use pre-calculated integer seconds
	const hOff = toHex(minsPastUtc)

	// Handle minute 0 case
	const tParam = minsPastUtc ? `${hMid},${hOff}` : hMid

	return `${BASE_URL}?t=${tParam}`
}
