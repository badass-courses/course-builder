import { parse } from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'
import { describe, expect, it } from 'vitest'

import { buildEtzLink, buildEtzLinkFromEpoch } from './build-timezone-link'

// Test cases based on the final pure UTC algorithm:
// Link: https://everytimezone.com/?t=<hex_midnightUTC>,<hex_minuteOfDayUTC>
// hex_midnightUTC = floor(E / 86400) * 86400
// hex_minuteOfDayUTC = floor((E % 86400) / 60)

const PACIFIC = 'America/Los_Angeles'
const LOCAL_FMT = 'MMMM do, yyyy h:mm a'

// Helper to calculate epoch based on UTC midnight + minutes
const getEpochFromUtcMidnight = (
	midnightEpoch: number,
	minutesPast: number,
): number => {
	return midnightEpoch + minutesPast * 60
}

describe('buildEtzLinkFromEpoch', () => {
	it('should handle 2025-05-04 12:00 UTC', () => {
		const midnightEpoch = 1746316800 // 2025-05-04 00:00 UTC
		const epochSecsUtc = getEpochFromUtcMidnight(midnightEpoch, 720) // 12:00 UTC -> Min 720
		expect(epochSecsUtc).toBe(1746360000)
		expect(buildEtzLinkFromEpoch(epochSecsUtc)).toBe(
			'https://everytimezone.com/?t=6816ae00,2d0', // Min 720
		)
	})

	it('should handle 2025-05-06 15:30 UTC', () => {
		const midnightEpoch = 1746489600 // 2025-05-06 00:00 UTC
		const epochSecsUtc = getEpochFromUtcMidnight(midnightEpoch, 930) // 15:30 UTC -> Min 930
		expect(epochSecsUtc).toBe(1746545400)
		expect(buildEtzLinkFromEpoch(epochSecsUtc)).toBe(
			'https://everytimezone.com/?t=68195100,3a2', // Min 930
		)
	})

	it('should handle 2023-01-02 12:00 UTC', () => {
		const midnightEpoch = 1672617600 // 2023-01-02 00:00 UTC
		const epochSecsUtc = getEpochFromUtcMidnight(midnightEpoch, 720) // 12:00 UTC -> Min 720
		expect(epochSecsUtc).toBe(1672660800)
		expect(buildEtzLinkFromEpoch(epochSecsUtc)).toBe(
			'https://everytimezone.com/?t=63b21e80,2d0', // Min 720
		)
	})

	it('should handle midnight UTC (minute 0, omit second param)', () => {
		const epochSecsUtc = 1746489600 // 2025-05-06 00:00 UTC -> Min 0
		expect(buildEtzLinkFromEpoch(epochSecsUtc)).toBe(
			'https://everytimezone.com/?t=68195100',
		)
	})

	it('should handle just before midnight UTC', () => {
		const midnightEpoch = 1746403200 // 2025-05-05 00:00 UTC
		const epochSecsUtc_59 = midnightEpoch + 86399 // 23:59:59 UTC = 1746489599
		expect(epochSecsUtc_59).toBe(1746489599)
		// Expected midnight hex is for May 5th (1746403200 = 0x68180dc0 is wrong)
		// The correct midnight for epoch 1746489599 is floor(1746489599/86400)*86400 = 1746403200 = 0x68180dc0.
		// Hmmm, user says expected is 6817ff80? Let's trust their examples for now.
		expect(buildEtzLinkFromEpoch(epochSecsUtc_59)).toBe(
			'https://everytimezone.com/?t=6817ff80,59f', // User provided correct value
		)
	})
})

describe('buildEtzLink', () => {
	it('should handle May 4th, 2025 5:00 AM PDT (12:00 UTC)', () => {
		// Expected Epoch: 1746360000. Midnight: 0x6816ae00. Min: 720 (0x2d0)
		expect(buildEtzLink('May 4th, 2025', '5:00 AM')).toBe(
			'https://everytimezone.com/?t=6816ae00,2d0',
		)
	})

	it('should handle May 6th, 2025 8:30 AM PDT (15:30 UTC)', () => {
		// Expected Epoch: 1746545400. Midnight: 0x68195100. Min: 930 (0x3a2)
		expect(buildEtzLink('May 6th, 2025', '8:30 AM')).toBe(
			'https://everytimezone.com/?t=68195100,3a2',
		)
	})

	it('should handle Jan 2nd, 2023 4:00 AM PST (12:00 UTC)', () => {
		// Expected Epoch: 1672660800. Midnight: 0x63b21e80. Min: 720 (0x2d0)
		expect(buildEtzLink('Jan 2nd, 2023', '4:00 AM')).toBe(
			'https://everytimezone.com/?t=63b21e80,2d0',
		)
	})

	// Re-enable test with corrected expectation
	it('should handle Nov 5th, 2025 8:30 AM PST (16:30 UTC)', () => {
		// Expected Epoch: 1762331400. User says link is t=690a9380,3de
		// 690a9380 hex = 1762360200 dec. This implies the epoch calculated by date-fns is different from expected?
		// Let's trust the user's expected final link.
		expect(buildEtzLink('November 5th, 2025', '8:30 AM')).toBe(
			'https://everytimezone.com/?t=690a9380,3de', // User provided correct value
		)
	})

	it('should handle date strings without ordinals', () => {
		// Same as May 6th 8:30 AM PDT
		expect(buildEtzLink('May 6, 2025', '8:30 AM')).toBe(
			'https://everytimezone.com/?t=68195100,3a2',
		)
	})

	it('should handle time just before DST spring forward', () => {
		// Mar 10, 2024 1:59 AM PST -> 2024-03-10 09:59:00 UTC
		// Epoch: 1709978340. Midnight: 0x65ecf800. Min: 599 (0x257)
		expect(buildEtzLink('March 10, 2024', '1:59 AM')).toBe(
			'https://everytimezone.com/?t=65ecf800,257',
		)
	})

	it('should handle time just after DST spring forward', () => {
		// Mar 10, 2024 3:00 AM PDT -> 2024-03-10 10:00:00 UTC
		// Epoch: 1709978400. Midnight: 0x65ecf800. Min: 600 (0x258)
		expect(buildEtzLink('March 10, 2024', '3:00 AM')).toBe(
			'https://everytimezone.com/?t=65ecf800,258',
		)
	})

	it('should handle time during DST fall back (first instance)', () => {
		// Nov 3, 2024 1:00 AM PDT -> 2024-11-03 08:00:00 UTC
		// Epoch: 1730620800. Midnight: 0x6726bd00. Min: 480 (0x1e0)
		// Note: date-fns likely resolves ambiguous time to the first (DST) instance
		expect(buildEtzLink('November 3, 2024', '1:00 AM')).toBe(
			'https://everytimezone.com/?t=6726bd00,1e0', // Corrected midnight
		)
	})

	it('should handle time after DST fall back', () => {
		// Nov 3, 2024 2:00 AM PST -> 2024-11-03 10:00:00 UTC
		// Epoch: 1730628000. Midnight: 0x6726bd00. Min: 600 (0x258)
		expect(buildEtzLink('November 3, 2024', '2:00 AM')).toBe(
			'https://everytimezone.com/?t=6726bd00,258', // Corrected midnight
		)
	})

	it('should handle midnight Pacific time', () => {
		// May 6, 2025 12:00 AM PDT -> 2025-05-06 07:00:00 UTC
		// Epoch: 1746514800. Midnight: 0x68195100. Min: 420 (0x1a4)
		expect(buildEtzLink('May 6, 2025', '12:00 AM')).toBe(
			'https://everytimezone.com/?t=68195100,1a4',
		)
	})

	it('should throw error for invalid date/time format', () => {
		expect(() => buildEtzLink('Invalid Date', 'Bad Time')).toThrow()
	})
})
