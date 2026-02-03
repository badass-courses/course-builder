import { getAbility } from '@/ability'
import { emailProvider } from '@/coursebuilder/email-provider'
import { courseBuilderAdapter, db } from '@/db'
import { users } from '@/db/schema'
import { env } from '@/env.mjs'
import { OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT } from '@/inngest/events/oauth-provider-account-linked'
import { USER_CREATED_EVENT } from '@/inngest/events/user-created'
import { inngest } from '@/inngest/inngest.server'
import { userHasRole } from '@/utils/user-has-role'
import { Identify, identify, init, track } from '@amplitude/analytics-node'
import DiscordProvider from '@auth/core/providers/discord'
import GithubProvider from '@auth/core/providers/github'
import { eq } from 'drizzle-orm'
import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth'

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
			roles: {
				id: string
				name: string
				description: string | null
				active: boolean
				createdAt: Date | null
				updatedAt: Date | null
				deletedAt: Date | null
			}[]
		} & DefaultSession['user']
	}

	interface User {
		// ...other properties
		id?: string
		email?: string | null
		role?: Role
		roles?: {
			id: string
			name: string
			description: string | null
			active: boolean
			createdAt: Date | null
			updatedAt: Date | null
			deletedAt: Date | null
		}[]
		entitlements?: {
			type: string
			expires?: Date | null
			metadata: Record<string, any> | null
		}[]
		memberships?: {
			id: string
			organizationId: string
		}[]
		organizationRoles?: {
			id: string
			organizationId: string
			name: string
			description: string | null
			active: boolean
			createdAt: Date | null
			updatedAt: Date | null
			deletedAt: Date | null
		}[]
		impersonatingFromUserId?: string
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
	// Use database sessions (default)
	session: {
		strategy: 'database',
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	callbacks: {
		session: async ({ session, user }) => {
			if (user?.id) {
				const dbUser = await db.query.users.findFirst({
					where: (u, { eq }) => eq(u.id, user.id),
					with: {
						roles: {
							with: {
								role: true,
							},
						},
					},
				})

				if (dbUser) {
					session.user.role = (dbUser.role as Role) || 'user'
					session.user.roles = dbUser.roles.map((userRole) => userRole.role)
				}
			}
			return session
		},
	},
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
			try {
				const { cookies } = await import('next/headers')
				const cookieStore = await cookies()
				cookieStore.delete('organizationId')
			} catch (error) {
				// Cookies not available (e.g., during build time)
				console.log('Cookies not available in signOut event:', error)
			}
		},
	},
	// No custom callbacks – use NextAuth defaults
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

	let enrichedSession = session
	if (session?.user?.id) {
		const dbUser = await db.query.users.findFirst({
			where: (u, { eq }) => eq(u.id, session.user.id),
			with: {
				roles: {
					with: {
						role: true,
					},
				},
			},
		})

		if (dbUser) {
			let primaryRole: Role = 'user'
			if (dbUser.role) primaryRole = dbUser.role as Role

			enrichedSession = {
				...session,
				user: {
					...session.user,
					role: primaryRole,
					roles: dbUser.roles.map((userRole) => userRole.role),
					memberships: [],
					organizationRoles: [],
					entitlements: [],
				},
			}
		}
	}

	const ability = getAbility({ user: enrichedSession?.user || undefined })

	return { session: enrichedSession, ability }
}

/**
 * Get the current session with impersonation support
 * This checks for impersonation cookies and returns the impersonated user's data
 */
export const getImpersonatedSession = async () => {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user) {
		return { session, ability, isImpersonating: false }
	}

	// Only check impersonation for admin users
	if (!userHasRole(session.user, 'admin')) {
		return { session, ability, isImpersonating: false }
	}

	try {
		const { cookies: getCookies } = await import('next/headers')
		const cookieStore = await getCookies()
		const impersonationCookie = cookieStore.get('epicweb-impersonation')

		if (!impersonationCookie?.value) {
			return { session, ability, isImpersonating: false }
		}

		const impersonationData = JSON.parse(impersonationCookie.value)

		// Verify the admin is the one who started the impersonation
		if (session.user.id !== impersonationData.adminId) {
			return { session, ability, isImpersonating: false }
		}

		// Fetch the target user
		const targetUser = await db.query.users.findFirst({
			where: eq(users.id, impersonationData.targetUserId),
			with: {
				roles: {
					with: {
						role: true,
					},
				},
			},
		})

		if (!targetUser) {
			return { session, ability, isImpersonating: false }
		}

		// Get the target user's roles
		let targetRole: Role = 'user'
		if (targetUser?.role) {
			targetRole = targetUser.role as Role
		}

		// Create an impersonated session
		const impersonatedSession = {
			...session,
			user: {
				...session.user,
				id: targetUser.id,
				email: targetUser.email,
				name: targetUser.name,
				image: targetUser.image,
				role: targetRole,
				roles: targetUser.roles.map((userRole) => userRole.role),
				memberships: [],
				organizationRoles: [],
				entitlements: [],
				// Keep track of the original admin
				impersonatingFromUserId: impersonationData.adminId,
			},
		}

		// Create ability for the impersonated user
		const impersonatedAbility = getAbility({ user: impersonatedSession.user })

		return {
			session: impersonatedSession,
			ability: impersonatedAbility,
			isImpersonating: true,
			originalUserId: impersonationData.adminId,
		}
	} catch (error) {
		console.error('Error in getImpersonatedSession:', error)
		return { session, ability, isImpersonating: false }
	}
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
