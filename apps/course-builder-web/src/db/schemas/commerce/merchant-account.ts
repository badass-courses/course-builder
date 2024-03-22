import { mysqlTable } from '@/db/mysql-table'

import { getMerchantAccountSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { merchantAccount } = getMerchantAccountSchema(mysqlTable)
