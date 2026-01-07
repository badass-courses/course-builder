import { NextResponse } from 'next/server'
import { db } from '@/db'
import { deviceVerifications } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hri } from 'human-readable-ids'
import { v4 } from 'uuid'

export async function POST() {
	const TEN_MINUTES_IN_MILLISECONDS = 60 * 10 * 1000
	const expires = new Date(Date.now() + TEN_MINUTES_IN_MILLISECONDS + 10000)

	const userCode = hri.random()
	const deviceCode = v4()

	await db.insert(deviceVerifications).values({
		userCode,
		deviceCode,
		createdAt: new Date(),
		expires,
	})

	const deviceVerification = await db.query.deviceVerifications.findFirst({
		where: eq(deviceVerifications.deviceCode, deviceCode),
	})

	if (!deviceVerification) {
		return NextResponse.json(
			{ error: 'Device verification not found' },
			{ status: 404 },
		)
	}

	return NextResponse.json({
		device_code: deviceVerification.deviceCode,
		user_code: deviceVerification.userCode,
		verification_uri: `${process.env.NEXT_PUBLIC_URL}/activate`,
		verification_uri_complete: `${process.env.NEXT_PUBLIC_URL}/activate?user_code=${deviceVerification.userCode}`,
		expires_in: TEN_MINUTES_IN_MILLISECONDS / 1000,
		interval: 5,
	})
}
