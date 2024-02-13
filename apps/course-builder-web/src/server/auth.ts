import { env } from '@/env.mjs'
import { USER_CREATED_EVENT } from '@/inngest/events'
import { inngest } from '@/inngest/inngest.server'
import { db } from '@/server/db'
import { mysqlTable } from '@/server/db/schema'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { getServerSession, type DefaultSession, type NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import TwitterProvider from 'next-auth/providers/twitter'

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
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
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

      const role: Role = dbUser?.role || 'user'

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role,
        },
      }
    },
  },
  adapter: DrizzleAdapter(db, mysqlTable),
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
  ],
  pages: {
    signIn: '/login',
    error: '/error',
    verifyRequest: '/check-your-email',
  },
}

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions)
