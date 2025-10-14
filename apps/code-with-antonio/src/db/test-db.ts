/// @ts-nocheck
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import { testPosts } from './test-schema'

export function createTestDb() {
	const sqlite = new Database(':memory:')
	const db = drizzle(sqlite, { schema: { testPosts } })

	// Create tables
	db.run(`CREATE TABLE IF NOT EXISTS posts (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		state TEXT NOT NULL DEFAULT 'draft',
		visibility TEXT NOT NULL DEFAULT 'public',
		post_type TEXT NOT NULL,
		created_by_id TEXT NOT NULL,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL,
		deleted_at TEXT,
		parent_lesson_id TEXT
	)`)

	return {
		db,
		cleanup: () => {
			sqlite.close()
		},
	}
}

export type TestDb = ReturnType<typeof createTestDb>['db']
