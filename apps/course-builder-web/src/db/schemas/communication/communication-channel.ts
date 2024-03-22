import { mysqlTable } from '@/db/mysql-table'

import { getCommunicationChannelSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { communicationChannel } =
	getCommunicationChannelSchema(mysqlTable)
