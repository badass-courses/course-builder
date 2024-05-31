import { relations, sql } from 'drizzle-orm'
import {
	MySqlTableFn,
	primaryKey,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from './users.js'

export function getDeviceVerificationSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'DeviceVerification',
		{
			verifiedByUserId: varchar('verifiedByUserId', { length: 255 }),
			deviceCode: text('deviceCode').notNull(),
			userCode: text('userCode').notNull(),
			expires: timestamp('expires', {
				mode: 'date',
				fsp: 3,
			}).notNull(),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			verifiedAt: timestamp('verifiedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(crr) => ({
			pk: primaryKey({ columns: [crr.deviceCode] }),
		}),
	)
}

export function getDeviceVerificationRelationsSchema(mysqlTable: MySqlTableFn) {
	const deviceVerification = getDeviceVerificationSchema(mysqlTable)
	const user = getUsersSchema(mysqlTable)
	return relations(deviceVerification, ({ one }) => ({
		verifiedBy: one(user, {
			fields: [deviceVerification.verifiedByUserId],
			references: [user.id],
			relationName: 'user',
		}),
	}))
}
