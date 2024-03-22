import { mysqlTable } from '@/db/mysql-table'

import { getPriceSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { price } = getPriceSchema(mysqlTable)
