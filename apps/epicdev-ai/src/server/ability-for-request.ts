import { NextRequest } from 'next/server'
import { getAbility, UserSchema } from '@/ability'
import { db } from '@/db'
import { deviceAccessToken } from '@/db/schema'
import { getAllUserEntitlements } from '@/lib/entitlements-query'
import { log } from '@/server/logger'
import { eq } from 'drizzle-orm'

export async function getUserAbilityForRequest(request: NextRequest) {
	const authToken = request.headers.get('Authorization')?.split(' ')[1]

	if (!authToken) {
		return { user: null, ability: getAbility() }
	}

	const deviceToken = await db.query.deviceAccessToken.findFirst({
		where: eq(deviceAccessToken.token, authToken),
		with: {
			verifiedBy: {
				with: {
					roles: {
						with: {
							role: true,
						},
					},
				},
			},
		},
	})

	if (!deviceToken) {
		return { user: null, ability: getAbility() }
	}

	const userParsed = UserSchema.safeParse({
		...deviceToken.verifiedBy,
		roles: deviceToken.verifiedBy.roles.map((role) => role.role),
	})

	if (!userParsed.success) {
		await log.error('user_parsing_failed', userParsed.error.format())
		console.log('User parsing failed:', userParsed.error.format())

		return { user: null, ability: getAbility() }
	}

	const user = userParsed.data

	// Fetch ALL entitlements for the device token user across all organizations
	const activeEntitlements = await getAllUserEntitlements(user.id)

	// Add entitlements to user object like session auth does
	const userWithEntitlements = {
		...user,
		entitlements: activeEntitlements.map((e) => ({
			type: e.entitlementType,
			expires: e.expiresAt,
			metadata: e.metadata || {},
		})),
	}

	const ability = getAbility({ user: userWithEntitlements })

	console.log('User authenticated:', {
		id: user.id,
		email: user.email,
		roles: user.roles?.map((r) => r.name),
		entitlementsCount: activeEntitlements.length,
	})

	return { user: userWithEntitlements, ability }
}
