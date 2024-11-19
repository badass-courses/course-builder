import { relations, sql } from 'drizzle-orm'
import {
	index,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from './users.js'

export function getDeviceAccessTokenSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'DeviceAccessToken',
		{
			token: varchar('token', { length: 191 }).notNull(),
			userId: varchar('userId', { length: 191 }).notNull(),
			organizationMembershipId: varchar('organizationMembershipId', {
				length: 191,
			}),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
		},
		(crr) => ({
			pk: primaryKey({ columns: [crr.token] }),
			userIdIdx: index('userId_idx').on(crr.userId),
		}),
	)
}

export function getDeviceAccessTokenRelationsSchema(mysqlTable: MySqlTableFn) {
	const deviceAccessToken = getDeviceAccessTokenSchema(mysqlTable)
	const user = getUsersSchema(mysqlTable)
	return relations(deviceAccessToken, ({ one }) => ({
		verifiedBy: one(user, {
			fields: [deviceAccessToken.userId],
			references: [user.id],
			relationName: 'user',
		}),
	}))
}
