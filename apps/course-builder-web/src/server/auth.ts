import { getAbility } from '@/ability'
import { emailProvider } from '@/coursebuilder/email-provider'
import { courseBuilderAdapter, db } from '@/db'
import { env } from '@/env.mjs'
import { USER_CREATED_EVENT } from '@/inngest/events/user-created'
import { inngest } from '@/inngest/inngest.server'
import GithubProvider from '@auth/core/providers/github'
import TwitterProvider from '@auth/core/providers/twitter'
import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth'

type Role = 'admin' | 'user'

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
			await inngest.send({ name: USER_CREATED_EVENT, user, data: {} })
		},
	},
	callbacks: {
		session: async ({ session, user }) => {
			const dbUser = await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, user.id),
			})

			const userRoles = await db.query.userRoles.findMany({
				where: (ur, { eq }) => eq(ur.userId, user.id),
				with: {
					role: true,
				},
			})

			const role: Role = dbUser?.role || 'user'

			return {
				...session,
				user: {
					...session.user,
					id: user.id,
					role,
					roles: userRoles.map((userRole) => userRole.role),
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
		...(env.TWITTER_CLIENT_ID && env.TWITTER_CLIENT_SECRET
			? [
					TwitterProvider({
						clientId: env.TWITTER_CLIENT_ID,
						clientSecret: env.TWITTER_CLIENT_SECRET,
						allowDangerousEmailAccountLinking: true,
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
} = NextAuth(authOptions)

export const getServerAuthSession = async () => {
	const session = await auth()
	const ability = getAbility({ user: session?.user })

	return { session, ability }
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
	console.log({ pro: authOptions.providers })
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
