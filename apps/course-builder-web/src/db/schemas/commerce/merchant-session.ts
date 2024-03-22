import { mysqlTable } from '@/db/mysql-table'

import { getMerchantSessionSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { merchantSession } = getMerchantSessionSchema(mysqlTable)
