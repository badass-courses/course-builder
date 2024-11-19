import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	primaryKey,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getOrganizationMembershipsSchema } from '../org/organization-memberships.js'

export function getCommentsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Comment',
		{
			id: varchar('id', { length: 191 }).notNull(),
			userId: varchar('userId', { length: 255 }).notNull(),
			organizationMembershipId: varchar('organizationMembershipId', {
				length: 255,
			}),
			context: json('context').$type<Record<string, any>>().default({}),
			text: text('text').notNull(),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(crr) => ({
			pk: primaryKey({ columns: [crr.id] }),
			crrUserIdIdKey: index('crr_userIdId_idx').on(crr.userId),
			organizationMembershipIdIdx: index('organizationMembershipId_idx').on(
				crr.organizationMembershipId,
			),
		}),
	)
}

export function getCommentRelationsSchema(mysqlTable: MySqlTableFn) {
	const comment = getCommentsSchema(mysqlTable)
	const user = getUsersSchema(mysqlTable)
	const organizationMemberships = getOrganizationMembershipsSchema(mysqlTable)
	return relations(comment, ({ one }) => ({
		user: one(user, {
			fields: [comment.userId],
			references: [user.id],
			relationName: 'user',
		}),
		organizationMembership: one(organizationMemberships, {
			fields: [comment.organizationMembershipId],
			references: [organizationMemberships.id],
			relationName: 'organizationMembership',
		}),
	}))
}
