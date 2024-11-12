import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	mysqlEnum,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getCommunicationChannelSchema } from './communication-channel.js'
import { getCommunicationPreferenceTypesSchema } from './communication-preference-types.js'

export function getCommunicationPreferencesSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'CommunicationPreference',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			organizationId: varchar('organizationId', { length: 191 }),
			userId: varchar('userId', { length: 255 }).notNull(),
			channelId: varchar('channelId', { length: 255 }).notNull(),
			preferenceLevel: mysqlEnum('preferenceLevel', ['low', 'medium', 'high'])
				.notNull()
				.default('medium'),
			preferenceTypeId: varchar('preferenceTypeId', { length: 255 }).notNull(),
			active: boolean('active').notNull().default(true),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			optInAt: timestamp('optInAt', {
				mode: 'date',
				fsp: 3,
			}),
			optOutAt: timestamp('optOutAt', {
				mode: 'date',
				fsp: 3,
			}),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(cp) => ({
			userIdIdx: index('userId_idx').on(cp.userId),
			preferenceTypeIdx: index('preferenceTypeId_idx').on(cp.preferenceTypeId),
			channelIdIdx: index('channelId_idx').on(cp.channelId),
			organizationIdIdx: index('organizationId_idx').on(cp.organizationId),
		}),
	)
}

export function getCommunicationPreferencesRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const communicationPreferences = getCommunicationPreferencesSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const communicationChannel = getCommunicationChannelSchema(mysqlTable)
	const communicationPreferenceTypes =
		getCommunicationPreferenceTypesSchema(mysqlTable)
	return relations(communicationPreferences, ({ one }) => ({
		user: one(users, {
			fields: [communicationPreferences.userId],
			references: [users.id],
			relationName: 'user',
		}),
		channel: one(communicationChannel, {
			fields: [communicationPreferences.channelId],
			references: [communicationChannel.id],
			relationName: 'channel',
		}),
		preferenceType: one(communicationPreferenceTypes, {
			fields: [communicationPreferences.preferenceTypeId],
			references: [communicationPreferenceTypes.id],
			relationName: 'preferenceType',
		}),
	}))
}
