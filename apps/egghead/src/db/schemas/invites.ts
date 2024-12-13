import { users } from '@/db/schema'
import { relations } from 'drizzle-orm'
import {
	int,
	mysqlEnum,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm/sql'
import { z } from 'zod'

export const inviteSchema = z.object({
	id: z.string().max(191),
	inviteState: z.enum([
		'INITIATED',
		'VERIFIED',
		'CANCELED',
		'EXPIRED',
		'COMPLETED',
	]),
	inviteEmail: z.string().max(191),
	acceptedEmail: z.string().max(191),
	userId: z.string().max(255),
	createdAt: z.date().nullable(),
	expiresAt: z.date().nullable(),
	canceledAt: z.date().nullable(),
	confirmedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
})

export function getInvitesSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable('Invite', {
		id: varchar('id', { length: 191 }).primaryKey(),
		inviteState: mysqlEnum('inviteState', [
			'INITIATED',
			'VERIFIED',
			'CANCELED',
			'EXPIRED',
			'COMPLETED',
		])
			.default('INITIATED')
			.notNull()
			.$type<'INITIATED' | 'VERIFIED' | 'CANCELED' | 'EXPIRED' | 'COMPLETED'>(),
		inviteEmail: varchar('inviteEmail', { length: 191 }).notNull(),
		acceptedEmail: varchar('acceptedEmail', { length: 191 }),
		userId: varchar('userId', { length: 255 }),
		createdAt: timestamp('createdAt').defaultNow(),
		expiresAt: timestamp('expiresAt').default(
			sql`(CURRENT_TIMESTAMP + INTERVAL 7 DAY)`,
		),
		canceledAt: timestamp('canceledAt'),
		confirmedAt: timestamp('confirmedAt'),
		completedAt: timestamp('completedAt'),
	})
}

export function getInvitesRelationsSchema(mysqlTable: MySqlTableFn) {
	const invites = getInvitesSchema(mysqlTable)

	return relations(invites, ({ one }) => ({
		user: one(users, {
			fields: [invites.userId],
			references: [users.id],
		}),
	}))
}
