import { type MySqlDatabase } from 'drizzle-orm/mysql-core'
import type { AnyMySqlTable, MySqlTableFn } from 'drizzle-orm/mysql-core'
import { type PgDatabase } from 'drizzle-orm/pg-core'
import type { AnyPgTable, PgTableFn } from 'drizzle-orm/pg-core'
import { type BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type { AnySQLiteTable, SQLiteTableFn } from 'drizzle-orm/sqlite-core'

import type { DefaultSchema as MySqlSchema } from './mysql/index.js'

export type AnyMySqlDatabase = MySqlDatabase<any, any>
export type AnyPgDatabase = PgDatabase<any, any, any>
export type AnySQLiteDatabase = BaseSQLiteDatabase<any, any, any, any>

export interface MinimumSchema {
	mysql: MySqlSchema & Record<string, AnyMySqlTable>
}

export type SqlFlavorOptions =
	| AnyMySqlDatabase
	| AnyPgDatabase
	| AnySQLiteDatabase

export type ClientFlavors<Flavor> = Flavor extends AnyMySqlDatabase
	? MinimumSchema['mysql']
	: never

export type TableFn<Flavor> = Flavor extends AnyMySqlDatabase
	? MySqlTableFn
	: Flavor extends AnyPgDatabase
		? PgTableFn
		: Flavor extends AnySQLiteDatabase
			? SQLiteTableFn
			: AnySQLiteTable

type NonNullableProps<T> = {
	[P in keyof T]: null extends T[P] ? never : P
}[keyof T]

export function stripUndefined<T>(obj: T): Pick<T, NonNullableProps<T>> {
	const result = {} as T
	for (const key in obj) if (obj[key] !== undefined) result[key] = obj[key]
	return result
}
