import { is } from 'drizzle-orm'
import { MySqlDatabase, MySqlTableFn } from 'drizzle-orm/mysql-core'
import { PgDatabase, PgTableFn } from 'drizzle-orm/pg-core'
import { BaseSQLiteDatabase, SQLiteTableFn } from 'drizzle-orm/sqlite-core'

import { mySqlDrizzleAdapter } from './lib/mysql.js'
import { pgDrizzleAdapter } from './lib/pg.js'
import { SQLiteDrizzleAdapter } from './lib/sqlite.js'
import { SqlFlavorOptions, TableFn } from './lib/utils.js'

type NO_IT_AINT = any

export function DrizzleAdapter<SqlFlavor extends SqlFlavorOptions>(
  db: SqlFlavor,
  table?: TableFn<SqlFlavor>,
): NO_IT_AINT {
  if (is(db, MySqlDatabase)) {
    return mySqlDrizzleAdapter(db, table as MySqlTableFn)
  } else if (is(db, PgDatabase)) {
    return pgDrizzleAdapter(db, table as PgTableFn)
  } else if (is(db, BaseSQLiteDatabase)) {
    return SQLiteDrizzleAdapter(db, table as SQLiteTableFn)
  }

  throw new Error(`Unsupported database type (${typeof db}) in Auth.js Drizzle adapter.`)
}
