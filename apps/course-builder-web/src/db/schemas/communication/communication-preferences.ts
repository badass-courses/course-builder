import { mysqlTable } from '@/db/mysql-table'
import { users } from '@/db/schemas/auth/users'
import { communicationChannel } from '@/db/schemas/communication/communication-channel'
import { communicationPreferenceTypes } from '@/db/schemas/communication/communication-preference-types'
import { relations } from 'drizzle-orm'

import { getCommunicationPreferencesSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { communicationPreferences } =
	getCommunicationPreferencesSchema(mysqlTable)

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
