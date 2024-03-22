import { mysqlTable } from '@/db/mysql-table'

import { getMerchantCustomerSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { merchantCustomer } = getMerchantCustomerSchema(mysqlTable)
