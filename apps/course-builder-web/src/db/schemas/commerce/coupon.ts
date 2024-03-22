import { mysqlTable } from '@/db/mysql-table'

import { getCouponSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { coupon } = getCouponSchema(mysqlTable)
