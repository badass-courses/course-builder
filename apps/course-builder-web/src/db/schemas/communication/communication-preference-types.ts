import { mysqlTable } from '@/db/mysql-table'

import { getCommunicationPreferenceTypesSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { communicationPreferenceTypes } =
	getCommunicationPreferenceTypesSchema(mysqlTable)
