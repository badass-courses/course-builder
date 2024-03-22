import { mysqlTable } from '@/db/mysql-table'
import { communicationChannel } from '@/db/schemas/communication-channel'
import { communicationPreferenceTypes } from '@/db/schemas/communication-preference-types'
import { users } from '@/db/schemas/users'
import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	mysqlEnum,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const communicationPreferences = mysqlTable(
	'communicationPreference',
	{
		id: varchar('id', { length: 255 }).notNull().primaryKey(),
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
	}),
)

export const communicationPreferencesRelations = relations(
	communicationPreferences,
	({ one }) => ({
		user: one(users, {
			fields: [communicationPreferences.userId],
			references: [users.id],
		}),
		channel: one(communicationChannel, {
			fields: [communicationPreferences.channelId],
			references: [communicationChannel.id],
		}),
		preferenceType: one(communicationPreferenceTypes, {
			fields: [communicationPreferences.preferenceTypeId],
			references: [communicationPreferenceTypes.id],
		}),
	}),
)
