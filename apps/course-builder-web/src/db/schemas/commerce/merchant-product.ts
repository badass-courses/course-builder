import { mysqlTable } from '@/db/mysql-table'

import { getMerchantProductSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { merchantProduct } = getMerchantProductSchema(mysqlTable)
