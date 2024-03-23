import { sql } from 'drizzle-orm'
import {
	datetime,
	mysqlEnum,
	MySqlTableFn,
	primaryKey,
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
			createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			expiresAt: datetime('expiresAt', { mode: 'string', fsp: 3 }),
			canceledAt: datetime('canceledAt', { mode: 'string', fsp: 3 }),
			confirmedAt: datetime('confirmedAt', { mode: 'string', fsp: 3 }),
			completedAt: datetime('completedAt', { mode: 'string', fsp: 3 }),
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
