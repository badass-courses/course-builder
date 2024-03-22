import { mysqlTable } from '@/db/mysql-table'

import { getResourceProgressSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { resourceProgress } = getResourceProgressSchema(mysqlTable)
