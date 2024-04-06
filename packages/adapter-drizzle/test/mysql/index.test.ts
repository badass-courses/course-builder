import { and, eq } from 'drizzle-orm'
import { runBasicTests } from 'utils/adapter.js'

import { DrizzleAdapter } from '../../src/index.js'
import { fixtures } from '../fixtures.js'
import {
	accounts,
	db,
	purchases,
	sessions,
	users,
	verificationTokens,
} from './schema.js'

runBasicTests({
	adapter: DrizzleAdapter(db),
	fixtures,
	db: {
		connect: async () => {
			await Promise.all([
				db.delete(sessions),
				db.delete(accounts),
				db.delete(verificationTokens),
				db.delete(users),
				db.delete(purchases),
			])
		},
		disconnect: async () => {
			await Promise.all([
				db.delete(sessions),
				db.delete(accounts),
				db.delete(verificationTokens),
				db.delete(users),
				db.delete(purchases),
			])
		},
		purchase: async (id) => {
			const purchase = await db
				.select()
				.from(purchases)
				.where(eq(purchases.id, id))
				.then((res) => res[0] ?? null)
			return purchase
		},
		user: async (id) => {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, id))
				.then((res) => res[0] ?? null)
			return user
		},
		session: async (sessionToken) => {
			const session = await db
				.select()
				.from(sessions)
				.where(eq(sessions.sessionToken, sessionToken))
				.then((res) => res[0] ?? null)

			return session
		},
		account: (provider_providerAccountId) => {
			const account = db
				.select()
				.from(accounts)
				.where(
					eq(
						accounts.providerAccountId,
						provider_providerAccountId.providerAccountId,
					),
				)
				.then((res) => res[0] ?? null)
			return account
		},
		verificationToken: (identifier_token) =>
			db
				.select()
				.from(verificationTokens)
				.where(
					and(
						eq(verificationTokens.token, identifier_token.token),
						eq(verificationTokens.identifier, identifier_token.identifier),
					),
				)
				.then((res) => res[0]) ?? null,
	},
})
