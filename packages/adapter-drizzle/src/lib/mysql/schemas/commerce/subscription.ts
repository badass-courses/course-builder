import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getOrganizationsSchema } from '../org/organizations.js'
import { getCouponSchema } from './coupon.js'
import { getMerchantChargeSchema } from './merchant-charge.js'
import { getMerchantSessionSchema } from './merchant-session.js'
import { getMerchantSubscriptionSchema } from './merchant-subscription.js'
import { getProductSchema } from './product.js'

export function getSubscriptionSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Subscription',
		{
			id: varchar('id', { length: 191 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			productId: varchar('productId', { length: 191 }).notNull(),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			merchantSubscriptionId: varchar('merchantSubscriptionId', {
				length: 191,
			}).notNull(),
			status: varchar('status', { length: 191 }).default('Valid').notNull(),
			fields: json('fields').$type<Record<string, any>>().default({}),
		},
		(table) => {
			return {
				subscriptionId: primaryKey({
					columns: [table.id],
					name: 'Subscription_id',
				}),
				organizationIdIdx: index('organizationId_idx').on(table.organizationId),
			}
		},
	)
}

export function getSubscriptionRelationsSchema(mysqlTable: MySqlTableFn) {
	const subscriptions = getSubscriptionSchema(mysqlTable)
	const products = getProductSchema(mysqlTable)

	const organizations = getOrganizationsSchema(mysqlTable)
	const merchantSubscriptions = getMerchantSubscriptionSchema(mysqlTable)

	return relations(subscriptions, ({ many, one }) => ({
		organization: one(organizations, {
			fields: [subscriptions.organizationId],
			references: [organizations.id],
			relationName: 'organization',
		}),
		product: one(products, {
			fields: [subscriptions.productId],
			references: [products.id],
			relationName: 'product',
		}),
		merchantSubscription: one(merchantSubscriptions, {
			fields: [subscriptions.merchantSubscriptionId],
			references: [merchantSubscriptions.id],
			relationName: 'merchantSubscription',
		}),
	}))
}
