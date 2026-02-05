import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getOrganizationMembershipsSchema } from '../org/organization-memberships.js'
import { getContentContributionsSchema } from './content-contributions.js'
import { getContentResourceProductSchema } from './content-resource-product.js'
import { getContentResourceResourceSchema } from './content-resource-resource.js'
import { getContentResourceTagSchema } from './content-resource-tag.js'
import { getContentResourceVersionSchema } from './content-resource-version.js'
import { getTagSchema } from './tag.js'

export function getContentResourceSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'ContentResource',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			organizationId: varchar('organizationId', { length: 191 }),
			createdByOrganizationMembershipId: varchar(
				'createdByOrganizationMembershipId',
				{
					length: 191,
				},
			),
			type: varchar('type', { length: 255 }).notNull(),
			createdById: varchar('createdById', { length: 255 }).notNull(),
			fields: json('fields').$type<Record<string, any>>().default({}),
			// Generated column for indexing JSON slug field
			fieldsSlug: varchar('fields_slug', { length: 255 }).generatedAlwaysAs(
				sql`(fields->>'$.slug')`,
				{ mode: 'stored' },
			),
			currentVersionId: varchar('currentVersionId', { length: 255 }),
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
		(cm) => ({
			typeIdx: index('type_idx').on(cm.type),
			createdByIdx: index('createdById_idx').on(cm.createdById),
			createdAtIdx: index('createdAt_idx').on(cm.createdAt),
			currentVersionIdIdx: index('currentVersionId_idx').on(
				cm.currentVersionId,
			),
			createdByOrganizationMembershipIdIdx: index(
				'createdByOrganizationMembershipId_idx',
			).on(cm.createdByOrganizationMembershipId),
			fieldsSlugIdx: index('fields_slug_idx').on(cm.fieldsSlug),
		}),
	)
}

export function getContentResourceRelationsSchema(mysqlTable: MySqlTableFn) {
	const contentResource = getContentResourceSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const contentResourceResource = getContentResourceResourceSchema(mysqlTable)
	const contentResourceProduct = getContentResourceProductSchema(mysqlTable)
	const contentContributions = getContentContributionsSchema(mysqlTable)
	const contentResourceTag = getContentResourceTagSchema(mysqlTable)
	const contentResourceVersion = getContentResourceVersionSchema(mysqlTable)
	const organizationMemberships = getOrganizationMembershipsSchema(mysqlTable)
	const tag = getTagSchema(mysqlTable)
	return relations(contentResource, ({ one, many }) => ({
		createdBy: one(users, {
			fields: [contentResource.createdById],
			references: [users.id],
			relationName: 'creator',
		}),
		createdByOrganizationMembership: one(organizationMemberships, {
			fields: [contentResource.createdByOrganizationMembershipId],
			references: [organizationMemberships.id],
			relationName: 'createdByOrganizationMembership',
		}),
		tags: many(contentResourceTag, { relationName: 'contentResource' }),
		resources: many(contentResourceResource, { relationName: 'resourceOf' }),
		resourceOf: many(contentResourceResource, { relationName: 'resource' }),
		resourceProducts: many(contentResourceProduct, {
			relationName: 'resource',
		}),
		contributions: many(contentContributions, {
			relationName: 'contributions',
		}),
		currentVersion: one(contentResourceVersion, {
			fields: [contentResource.currentVersionId],
			references: [contentResourceVersion.id],
			relationName: 'currentVersionResource',
		}),
		versions: many(contentResourceVersion, { relationName: 'resource' }),
	}))
}
