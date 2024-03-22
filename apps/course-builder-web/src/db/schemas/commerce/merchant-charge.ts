import { mysqlTable } from '@/db/mysql-table'

import { getMerchantChargeSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { merchantCharge } = getMerchantChargeSchema(mysqlTable)
