/** *
Build Every Time Zone links
* * @param param1 - Description of parameter 1 * @returns Description of return
value * * @example * ```ts *
buildEtzLink('example') * // Returns expected result * ``` */

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
 */
export const decodeT = (t: string): Date => {
	const [epochHex = '0', minsHex = '0'] = t.split(',')
	const midnightUTCms = parseInt(epochHex, 16) * 1000 // ms
	const minsPastUtc = parseInt(minsHex, 16)
	const instantUTCms = midnightUTCms + minsPastUtc * 60000

	// Return Date object representing the calculated UTC instant.
	return new Date(instantUTCms)
}

/**
 * helpers if you're lazily handing urls around:
 */
export const extractParam = (url: string): string => {
	const match = url.match(/[?&\/]t=([\da-f,]+)/i)

	// Use optional chaining for cleaner access to the capture group
	const tParam = match?.[1]
	if (tParam && typeof tParam === 'string') {
		return tParam
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

	// Reuse the encodeT function for consistency
	const tParam = encodeT(d)

	return `${BASE_URL}?t=${tParam}`
}
