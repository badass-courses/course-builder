import { sql } from 'drizzle-orm'
import {
	mysqlEnum,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getPurchaseUserTransferSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'purchaseUserTransfers',
		{
			id: varchar('id', { length: 191 }).notNull(),
			transferState: mysqlEnum('transferState', [
				'AVAILABLE',
				'INITIATED',
				'VERIFIED',
				'CANCELED',
				'EXPIRED',
				'CONFIRMED',
				'COMPLETED',
			])
				.default('AVAILABLE')
				.notNull(),
			purchaseId: varchar('purchaseId', { length: 191 }).notNull(),
			sourceUserId: varchar('sourceUserId', { length: 191 }).notNull(),
			targetUserId: varchar('targetUserId', { length: 191 }),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			expiresAt: timestamp('expiresAt', { mode: 'date', fsp: 3 }),
			canceledAt: timestamp('canceledAt', { mode: 'date', fsp: 3 }),
			confirmedAt: timestamp('confirmedAt', { mode: 'date', fsp: 3 }),
			completedAt: timestamp('completedAt', { mode: 'date', fsp: 3 }),
		},
		(table) => {
			return {
				purchaseUserTransferId: primaryKey({
					columns: [table.id],
					name: 'PurchaseUserTransfer_id',
				}),
			}
		},
	)
}
