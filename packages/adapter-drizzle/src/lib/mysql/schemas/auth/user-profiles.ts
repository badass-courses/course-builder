import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getProfilesSchema } from './profiles.js'
import { getUsersSchema } from './users.js'

export function getUserProfilesSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'UserProfile',
		{
			userId: varchar('userId', { length: 255 }).notNull(),
			profileId: varchar('profileId', { length: 255 }).notNull(),
			active: boolean('active').notNull().default(true),
			organizationId: varchar('organizationId', { length: 191 }),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(ur) => ({
			pk: primaryKey({ columns: [ur.userId, ur.profileId] }),
			userIdIdx: index('userId_idx').on(ur.userId),
			profileIdIdx: index('profileId_idx').on(ur.profileId),
			organizationIdIdx: index('organizationId_idx').on(ur.organizationId),
		}),
	)
}

export function getUserProfilesRelationsSchema(mysqlTable: MySqlTableFn) {
	const userProfiles = getUserProfilesSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const profiles = getProfilesSchema(mysqlTable)
	return relations(userProfiles, ({ one, many }) => ({
		user: one(users, {
			fields: [userProfiles.userId],
			references: [users.id],
			relationName: 'user',
		}),
		profile: one(profiles, {
			fields: [userProfiles.profileId],
			references: [profiles.id],
			relationName: 'profile',
		}),
	}))
}
