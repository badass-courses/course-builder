import { is } from 'drizzle-orm'
import { MySqlDatabase, type MySqlTableFn } from 'drizzle-orm/mysql-core'

import { type CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import { Provider } from '@coursebuilder/core/providers'
import { PaymentsProviderConfig } from '@coursebuilder/core/types'

import {
	createTables as createMySqlTables,
	mySqlDrizzleAdapter,
} from './lib/mysql/index.js'
import { type SqlFlavorOptions, type TableFn } from './lib/utils.js'

export function DrizzleAdapter<SqlFlavor extends SqlFlavorOptions>(
	db: SqlFlavor,
	table: TableFn<SqlFlavor>,
	paymentProvider: PaymentsProviderConfig,
): CourseBuilderAdapter {
	if (is(db, MySqlDatabase)) {
		return mySqlDrizzleAdapter(db, table as MySqlTableFn, paymentProvider)
	}

	throw new Error(
		`Unsupported database type (${typeof db}) in Auth.js Drizzle adapter.`,
	)
}

export { createMySqlTables }
