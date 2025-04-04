import { NextResponse } from 'next/server'
import { getUser } from '@/app/oauth/userinfo/get-user'
import { db } from '@/db'
import { deviceAccessToken, deviceVerifications } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
	const formData = await request.formData()
	const device_code = formData.get('device_code')

	const deviceVerification = await db.query.deviceVerifications.findFirst({
		where: eq(deviceVerifications.deviceCode, device_code as string),
	})

	if (deviceVerification) {
		if (
			!deviceVerification.verifiedAt &&
			new Date() > deviceVerification.expires
		) {
			return NextResponse.json(
				{
					error: 'expired_token',
					error_description: 'The device verification has expired',
				},
				{ status: 403 },
			)
		}

		if (!deviceVerification.verifiedAt) {
			return NextResponse.json(
				{
					error: 'authorization_pending',
					error_description: 'The device verification is pending',
				},
				{ status: 403 },
			)
		}

		const user = await getUser(deviceVerification.verifiedByUserId)

		if (user) {
			await db.insert(deviceAccessToken).values({
				userId: user.id,
				token: crypto.randomUUID(),
			})

			const deviceToken = await db.query.deviceAccessToken.findFirst({
				where: eq(deviceAccessToken.userId, user.id),
			})

			await db
				.delete(deviceVerifications)
				.where(
					eq(deviceVerifications.deviceCode, deviceVerification.deviceCode),
				)

			if (!deviceToken) {
				return NextResponse.json(
					{
						error: 'access_denied',
						error_description: 'Device token not found',
					},
					{ status: 403 },
				)
			}

			return NextResponse.json({
				access_token: deviceToken.token,
				token_type: 'bearer',
				scope: 'content:read progress',
			})
		} else {
			return NextResponse.json(
				{
					error: 'access_denied',
					error_description: 'User not found',
				},
				{ status: 403 },
			)
		}
	} else {
		return NextResponse.json(
			{
				error: 'access_denied',
				error_description: 'The device code is invalid',
			},
			{ status: 403 },
		)
	}
}
