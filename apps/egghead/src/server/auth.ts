import { getAbility } from '@/ability'
import { emailProvider } from '@/coursebuilder/email-provider'
import { courseBuilderAdapter, db } from '@/db'
import { accounts } from '@/db/schema'
import { env } from '@/env.mjs'
import { USER_CREATED_EVENT } from '@/inngest/events/user-created'
import { inngest } from '@/inngest/inngest.server'
import { validateProfileForSanity } from '@/lib/instructor'
import { syncInstructorToSanity } from '@/lib/instructor-query'
import { addRoleToUser } from '@/lib/users'
import GithubProvider from '@auth/core/providers/github'
import TwitterProvider from '@auth/core/providers/twitter'
import { eq } from 'drizzle-orm'
import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth'
import { z } from 'zod'

import egghead from '@coursebuilder/core/providers/egghead'
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
		linkAccount: async ({ account, user, profile }) => {
			console.log('linkAccount', { account, user, profile })
		},
		signIn: async (params) => {
			console.log('signIn', params)
			const { user, account } = params
			const profile = z
				.object({
					roles: z.array(z.string()),
				})
				.parse(params.profile)

			if (account) {
				await db
					.update(accounts)
					.set({
						access_token: account.access_token,
						expires_at: account.expires_at,
					})
					.where(eq(accounts.providerAccountId, account.providerAccountId))
			}

			if (user.id && profile.roles.includes('instructor')) {
				await addRoleToUser(user.id, 'contributor')
				await syncInstructorToSanity(validateProfileForSanity(params.profile))
			}
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
		egghead({
			clientId: process.env.EGGHEAD_CLIENT_ID,
			clientSecret: process.env.EGGHEAD_CLIENT_SECRET,
			allowDangerousEmailAccountLinking: true,
		}),
	],
	pages: {
		signIn: '/login',
		error: '/login',
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
	const ability = getAbility({ user: session?.user })

	return { session: { ...session, user }, ability }
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
