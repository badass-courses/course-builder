import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { deviceAccessToken as deviceAccessTokenTable } from '@/db/schema'
import { getDiscordUser } from '@/lib/discord-query'
import { eq } from 'drizzle-orm'

import { getUser } from './get-user'

export async function GET(request: Request) {
	const headersList = await headers()
	const deviceAccessToken = headersList.get('Authorization')?.split(' ')[1]

	if (deviceAccessToken) {
		const token = await db.query.deviceAccessToken.findFirst({
			where: eq(deviceAccessTokenTable.token, deviceAccessToken),
		})
		if (token?.userId) {
			const user = await getUser(token.userId)

			const discordAccountId = user?.accounts?.find(
				(account) => account.provider === 'discord',
			)?.providerAccountId

			const discordProfile = await getDiscordUser(discordAccountId || null)

			return NextResponse.json({ ...user, discordProfile })
		} else {
			return NextResponse.json(
				{
					error: 'not_found',
					error_description: 'User not found.',
				},
				{ status: 404 },
			)
		}
	} else {
		return NextResponse.json(
			{
				error: 'access_denied',
				error_description: 'Nothing to see here.',
			},
			{ status: 403 },
		)
	}
}
