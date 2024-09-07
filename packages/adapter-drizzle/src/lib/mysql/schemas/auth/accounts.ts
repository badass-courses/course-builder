import { AdapterAccount } from '@auth/core/adapters'
import { relations } from 'drizzle-orm'
import {
	index,
	int,
	MySqlTableFn,
	primaryKey,
	text,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from './users.js'

export function getAccountsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Account',
		{
			userId: varchar('userId', { length: 255 }).notNull(),
			type: varchar('type', { length: 255 })
				.$type<AdapterAccount['type']>()
				.notNull(),
			provider: varchar('provider', { length: 255 }).notNull(),
			providerAccountId: varchar('providerAccountId', {
				length: 255,
			}).notNull(),
			refresh_token: text('refresh_token'),
			access_token: text('access_token'),
			oauth_token: text('oauth_token'),
			oauth_token_secret: text('oauth_token_secret'),
			expires_at: int('expires_at'),
			token_type: varchar('token_type', { length: 255 }),
			scope: varchar('scope', { length: 255 }),
			id_token: text('id_token'),
			session_state: varchar('session_state', { length: 255 }),
			refresh_token_expires_in: int('refresh_token_expires_in'),
		},
		(account) => ({
			pk: primaryKey({
				columns: [account.provider, account.providerAccountId],
			}),
			userIdIdx: index('userId_idx').on(account.userId),
		}),
	)
}

export function getAccountsRelationsSchema(mysqlTable: MySqlTableFn) {
	const accounts = getAccountsSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	return relations(accounts, ({ one }) => ({
		user: one(users, {
			fields: [accounts.userId],
			references: [users.id],
			relationName: 'user',
		}),
	}))
}
