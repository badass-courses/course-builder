import { mysqlTable } from '@/db/mysql-table'

import { getProductSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { product } = getProductSchema(mysqlTable)
