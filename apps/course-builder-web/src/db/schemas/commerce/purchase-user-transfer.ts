import { mysqlTable } from '@/db/mysql-table'

import { getPurchaseUserTransferSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { purchaseUserTransfer } =
	getPurchaseUserTransferSchema(mysqlTable)
