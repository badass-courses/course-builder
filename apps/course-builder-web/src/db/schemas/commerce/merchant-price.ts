import { mysqlTable } from '@/db/mysql-table'

import { getMerchantPriceSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { merchantPrice } = getMerchantPriceSchema(mysqlTable)
