import { cookies, headers } from 'next/headers'
import { getAbility, UserSchema } from '@/ability'
import { emailProvider } from '@/coursebuilder/email-provider'
import { courseBuilderAdapter, db } from '@/db'
import { accounts, entitlements, organizationMemberships } from '@/db/schema'
import { env } from '@/env.mjs'
import { OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT } from '@/inngest/events/oauth-provider-account-linked'
import { USER_CREATED_EVENT } from '@/inngest/events/user-created'
import { inngest } from '@/inngest/inngest.server'
import { Identify, identify, init, track } from '@amplitude/analytics-node'
import DiscordProvider from '@auth/core/providers/discord'
import GithubProvider from '@auth/core/providers/github'
import TwitterProvider from '@auth/core/providers/twitter'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'
import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth'

import { userSchema } from '@coursebuilder/core/schemas'

type Role = 'admin' | 'user' | string

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
	interface Session extends DefaultSession {
		user: {
			id: string
			role: Role
		} & DefaultSession['user']
	}

	interface User {
		// ...other properties
		id?: string
		email?: string | null
		role?: Role
		roles: {
			id: string
			name: string
			description: string | null
			active: boolean
			createdAt: Date | null
			updatedAt: Date | null
			deletedAt: Date | null
		}[]
		entitlements: {
			type: string
			expires?: Date | null
			metadata: Record<string, any> | null
		}[]
		memberships?:
			| {
					organizationId: string | null
					id: string
					name: string
					description: string | null
					active: boolean
					createdAt: Date | null
					updatedAt: Date | null
					deletedAt: Date | null
			  }[]
			| null
		organizationRoles?: {
			organizationId: string | null
			id: string
			name: string
			description: string | null
			active: boolean
			createdAt: Date | null
			updatedAt: Date | null
			deletedAt: Date | null
		}[]
	}
}

async function refreshDiscordToken(account: { refresh_token: string | null }) {
	try {
		if (!account.refresh_token) throw new Error('No refresh token')

		const myHeaders = new Headers()
		myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')

		const urlencoded = new URLSearchParams()
		if (
			env.DISCORD_CLIENT_ID === undefined ||
			env.DISCORD_CLIENT_SECRET === undefined
		) {
			throw new Error('Discord client ID and secret are not set')
		}
		urlencoded.append('client_id', env.DISCORD_CLIENT_ID)
		urlencoded.append('client_secret', env.DISCORD_CLIENT_SECRET)
		urlencoded.append('grant_type', 'refresh_token')
		urlencoded.append('refresh_token', account.refresh_token)

		const requestOptions = {
			method: 'POST',
			headers: myHeaders,
			body: urlencoded,
		}

		const response = await fetch(
			'https://discord.com/api/oauth2/token',
			requestOptions,
		)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const tokensOrError = await response.json()

		if (!response.ok) throw tokensOrError

		return tokensOrError as {
			access_token: string
			expires_in: number
			refresh_token?: string
		}
	} catch (error) {
		return { error: 'Failed to refresh session' }
	}
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthConfig = {
	events: {
		createUser: async ({ user }) => {
			if (env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
				init(env.NEXT_PUBLIC_AMPLITUDE_API_KEY)
				const identifyObj = new Identify()
				identify(identifyObj, {
					user_id: user.email || user.id,
				})
				track('user-created', { userId: user.email })
			}

			await inngest.send({ name: USER_CREATED_EVENT, user, data: {} })
		},
		linkAccount: async ({ user, account, profile }) => {
			if (env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
				init(env.NEXT_PUBLIC_AMPLITUDE_API_KEY)
				const identifyObj = new Identify()
				identify(identifyObj, {
					user_id: user.email || user.id,
				})
				track('account-linked', { account: account.provider })
			}
			await inngest.send({
				name: OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT,
				data: { account, profile },
				user,
			})
		},
		signOut: async () => {
			const cookieStore = await cookies()
			cookieStore.delete('organizationId')
		},
	},
	callbacks: {
		session: async ({ session, user }) => {
			const dbUser = await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, user.id),
				with: {
					accounts: true,
					organizationMemberships: {
						with: {
							organization: true,
							organizationMembershipRoles: {
								with: {
									role: true,
								},
							},
						},
					},
				},
			})

			const discordAccount = dbUser?.accounts.find(
				(account) => account.provider === 'discord',
			)

			const isDiscordTokenExpired = Boolean(
				discordAccount?.expires_at &&
					discordAccount.expires_at * 1000 < Date.now(),
			)

			if (discordAccount && isDiscordTokenExpired) {
				console.log('refreshing discord token')
				const refreshedToken = await refreshDiscordToken(discordAccount)

				if (
					'access_token' in refreshedToken &&
					'expires_in' in refreshedToken &&
					'refresh_token' in refreshedToken
				) {
					await db
						.update(accounts)
						.set({
							access_token: refreshedToken.access_token,
							expires_at: Math.floor(
								Date.now() / 1000 + refreshedToken.expires_in,
							),
							refresh_token: refreshedToken.refresh_token,
						})
						.where(
							and(
								eq(
									accounts.providerAccountId,
									discordAccount.providerAccountId,
								),
								eq(accounts.provider, 'discord'),
								eq(accounts.userId, user.id),
							),
						)
				}
			}

			const userRoles = await db.query.userRoles.findMany({
				where: (ur, { eq }) => eq(ur.userId, user.id),
				with: {
					role: true,
				},
			})

			const headersList = await headers()
			const organizationId = headersList.get('x-organization-id')
			const role = dbUser?.role || 'user'

			const organizationRoles =
				dbUser?.organizationMemberships.flatMap((membership) =>
					membership.organizationMembershipRoles.map((role) => role.role),
				) || []

			const currentMembership = organizationId
				? await db.query.organizationMemberships.findFirst({
						where: and(
							eq(organizationMemberships.organizationId, organizationId),
							eq(organizationMemberships.userId, user.id),
						),
						orderBy: (om, { asc }) => [asc(om.createdAt)],
					})
				: null

			const activeEntitlements = currentMembership
				? await db.query.entitlements.findMany({
						where: and(
							eq(entitlements.organizationMembershipId, currentMembership.id),
							or(
								isNull(entitlements.expiresAt),
								gt(entitlements.expiresAt, sql`CURRENT_TIMESTAMP`),
							),
							isNull(entitlements.deletedAt),
						),
					})
				: []

			return {
				...session,
				user: {
					...session.user,
					id: user.id,
					role: role as Role,
					roles: userRoles.map((userRole) => userRole.role),
					organizationRoles,
					entitlements: activeEntitlements.map((e) => ({
						type: e.entitlementType,
						expires: e.expiresAt,
						metadata: e.metadata || null,
					})),
				},
			}
		},
	},
	adapter: courseBuilderAdapter,
	providers: [
		/**
		 * ...add more providers here.
		 *
		 * Most other providers require a bit more work than the Discord provider. For example, the
		 * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
		 * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
		 *
		 * @see https://next-auth.js.org/providers/github
		 */
		...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
			? [
					GithubProvider({
						clientId: env.GITHUB_CLIENT_ID,
						clientSecret: env.GITHUB_CLIENT_SECRET,
						allowDangerousEmailAccountLinking: true,
					}),
				]
			: []),
		...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
			? [
					DiscordProvider({
						clientId: env.DISCORD_CLIENT_ID,
						clientSecret: env.DISCORD_CLIENT_SECRET,
						allowDangerousEmailAccountLinking: true,
						authorization:
							'https://discord.com/api/oauth2/authorize?scope=identify+email+guilds.join+guilds',
					}),
				]
			: []),
		emailProvider,
	],
	pages: {
		signIn: '/login',
		error: '/error',
		verifyRequest: '/check-your-email',
	},
}

export const {
	handlers: { GET, POST },
	auth,
	signIn,
} = NextAuth(authOptions)

export const getServerAuthSession = async () => {
	const session = await auth()
	const user = userSchema.optional().nullable().parse(session?.user)
	const parsedUser = UserSchema.nullish().parse(session?.user)
	const ability = getAbility({ user: parsedUser || undefined })

	return { session: session ? { ...session, user } : null, ability }
}

export type Provider = {
	id: string
	name: string
	type: string
	style: {
		logo: string
		bg: string
		text: string
	}
	signinUrl: string
}

export function getProviders(): Record<string, Provider> | null {
	const providerKeys: (keyof Provider)[] = ['id', 'name', 'type', 'style']
	return authOptions.providers.reduce((acc, provider) => {
		return {
			...acc,
			// @ts-ignore
			[provider.id]: {
				...getKeyValuesFromObject<Provider>(provider, providerKeys),
				// @ts-ignore
				signinUrl: `/api/auth/signin/${provider.id}`,
			},
		}
	}, {})
}

function getKeyValuesFromObject<T>(obj: any, keys: (keyof T)[]): T {
	return keys.reduce((acc, key) => {
		if (obj[key]) {
			acc[key] = obj[key]
		}
		return acc
	}, {} as T)
}
