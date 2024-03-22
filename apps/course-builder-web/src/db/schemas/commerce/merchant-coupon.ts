import { mysqlTable } from '@/db/mysql-table'

import { getMerchantCouponSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { merchantCoupon } = getMerchantCouponSchema(mysqlTable)
