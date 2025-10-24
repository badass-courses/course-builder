import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	primaryKey,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getMerchantAccountSchema } from './merchant-account.js'

/**
 * MerchantEvents table for tracking webhook events from payment providers
 * This provides an audit trail of what webhooks we received, regardless of
 * whether Inngest successfully processed them or not.
 */
export function getMerchantEventsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'MerchantEvents',
		{
			id: varchar('id', { length: 191 }).notNull(),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
			identifier: varchar('identifier', { length: 191 }).notNull(),
			payload: json('payload').notNull(),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
		},
		(table) => {
			return {
				merchantEventsId: primaryKey({
					columns: [table.id],
					name: 'MerchantEvents_id',
				}),
				merchantEventsIdentifierKey: unique('MerchantEvents_identifier_key').on(
					table.identifier,
				),
				merchantAccountIdIdx: index('merchantAccountId_idx').on(
					table.merchantAccountId,
				),
				createdAtIdx: index('createdAt_idx').on(table.createdAt),
			}
		},
	)
}

export function getMerchantEventsRelationsSchema(mysqlTable: MySqlTableFn) {
	const merchantEvents = getMerchantEventsSchema(mysqlTable)
	const merchantAccount = getMerchantAccountSchema(mysqlTable)

	return relations(merchantEvents, ({ one }) => ({
		merchantAccount: one(merchantAccount, {
			fields: [merchantEvents.merchantAccountId],
			references: [merchantAccount.id],
			relationName: 'merchantAccount',
		}),
	}))
}
