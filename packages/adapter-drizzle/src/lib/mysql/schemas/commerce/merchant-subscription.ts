import { relations, sql } from 'drizzle-orm'
import {
	index,
	int,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getMerchantChargeSchema } from './merchant-charge.js'
import { getSubscriptionSchema } from './subscription.js'

export function getMerchantSubscriptionSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'MerchantSubscription',
		{
			id: varchar('id', { length: 191 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
			status: int('status').default(0).notNull(),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			label: varchar('label', { length: 191 }),
			identifier: varchar('identifier', { length: 191 }),
			merchantCustomerId: varchar('merchantCustomerId', {
				length: 191,
			}).notNull(),
			merchantProductId: varchar('merchantProductId', {
				length: 191,
			}).notNull(),
		},
		(table) => {
			return {
				merchantSubscriptionId: primaryKey({
					columns: [table.id],
					name: 'MerchantSubscription_id',
				}),
				organizationIdIdx: index('organizationId_idx').on(table.organizationId),
			}
		},
	)
}

export function getMerchantSubscriptionRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const merchantSubscription = getMerchantSubscriptionSchema(mysqlTable)
	const merchantCharge = getMerchantChargeSchema(mysqlTable)
	const subscription = getSubscriptionSchema(mysqlTable)
	return relations(merchantSubscription, ({ many, one }) => ({
		merchantCharges: many(merchantCharge, {
			relationName: 'merchantSubscription',
		}),
		subscription: one(subscription, {
			fields: [merchantSubscription.id],
			references: [subscription.merchantSubscriptionId],
			relationName: 'subscription',
		}),
	}))
}
