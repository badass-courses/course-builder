import { mysqlTable } from '@/db/mysql-table'
import {
	int,
	json,
	mysqlEnum,
	primaryKey,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getCourseBuilderSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const {
	accounts,
	accountsRelations,
	profiles,
	profilesRelations,
	permissions,
	permissionsRelations,
	rolePermissions,
	rolePermissionsRelations,
	roles,
	rolesRelations,
	sessions,
	sessionsRelations,
	userPermissions,
	userPermissionsRelations,
	userRoles,
	userRolesRelations,
	users,
	usersRelations,
	verificationTokens,
	communicationChannel,
	communicationPreferenceTypes,
	communicationPreferences,
	communicationPreferencesRelations,
	contentContributions,
	contentContributionRelations,
	contentResource,
	contentResourceRelations,
	contentResourceVersion,
	contentResourceVersionRelations,
	contentResourceResource,
	contentResourceResourceRelations,
	contributionTypes,
	contributionTypesRelations,
	resourceProgress,
	organization,
	organizationRelations,
	organizationMemberships,
	organizationMembershipRelations,
	organizationMembershipRoles,
	organizationMembershipRolesRelations,
} = getCourseBuilderSchema(mysqlTable)

// Section support for Epic Web
export const section = mysqlTable('section', {
	id: varchar('id', { length: 255 }).primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	position: int('position').notNull().default(0),
	metadata: json('metadata'),
	contentResourceId: varchar('content_resource_id', { length: 255 })
		.notNull()
		.references(() => contentResource.id, { onDelete: 'cascade' }),
	createdById: varchar('created_by_id', { length: 255 }).references(
		() => users.id,
	),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
	publishedAt: timestamp('published_at'),
})

// Section to resource relationship
export const sectionResource = mysqlTable(
	'section_resource',
	{
		sectionId: varchar('section_id', { length: 255 })
			.notNull()
			.references(() => section.id, { onDelete: 'cascade' }),
		resourceId: varchar('resource_id', { length: 255 })
			.notNull()
			.references(() => contentResource.id, { onDelete: 'cascade' }),
		position: int('position').notNull().default(0),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.sectionId, table.resourceId] }),
		}
	},
)
