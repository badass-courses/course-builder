import { AdapterAccount } from '@auth/core/adapters'
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  double,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator((name) => `inngest-gpt_${name}`)

export const users = mysqlTable(
  'user',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 255 }),
    role: mysqlEnum('role', ['user', 'admin']).default('user'),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('emailVerified', {
      mode: 'date',
      fsp: 3,
    }),
    image: varchar('image', { length: 255 }),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (user) => ({
    emailIdx: index('email_idx').on(user.email),
    roleIdx: index('role_idx').on(user.role),
  }),
)

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  communicationPreferences: many(communicationPreferences),
  userRoles: many(userRoles),
  userPermissions: many(userPermissions),
  contributions: many(contentContributions),
  createdContent: many(contentResource),
}))

export const permissions = mysqlTable(
  'permission',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (permission) => ({
    nameIdx: index('name_idx').on(permission.name),
  }),
)

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}))

export const roles = mysqlTable(
  'role',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (role) => ({
    nameIdx: index('name_idx').on(role.name),
  }),
)

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}))

export const userRoles = mysqlTable(
  'userRole',
  {
    userId: varchar('userId', { length: 255 }).notNull(),
    roleId: varchar('roleId', { length: 255 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (ur) => ({
    pk: primaryKey({ columns: [ur.userId, ur.roleId] }),
    userIdIdx: index('userId_idx').on(ur.userId),
    roleIdIdx: index('roleId_idx').on(ur.roleId),
  }),
)

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}))

export const userPermissions = mysqlTable(
  'userPermission',
  {
    userId: varchar('userId', { length: 255 }).notNull(),
    permissionId: varchar('permissionId', { length: 255 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (up) => ({
    pk: primaryKey({ columns: [up.userId, up.permissionId] }),
    userIdIdx: index('userId_idx').on(up.userId),
    permissionIdIdx: index('permissionId_idx').on(up.permissionId),
  }),
)

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, { fields: [userPermissions.userId], references: [users.id] }),
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
}))

export const rolePermissions = mysqlTable(
  'rolePermission',
  {
    roleId: varchar('roleId', { length: 255 }).notNull(),
    permissionId: varchar('permissionId', { length: 255 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (rp) => ({
    pk: primaryKey({ columns: [rp.roleId, rp.permissionId] }),
    roleIdIdx: index('roleId_idx').on(rp.roleId),
    permissionIdIdx: index('permissionId_idx').on(rp.permissionId),
  }),
)

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}))

export const contentContributions = mysqlTable(
  'contentContribution',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    userId: varchar('userId', { length: 255 }).notNull(),
    contentId: varchar('contentId', { length: 255 }).notNull(),
    contributionTypeId: varchar('contributionTypeId', { length: 255 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (cc) => ({
    userIdIdx: index('userId_idx').on(cc.userId),
    contentIdIdx: index('contentId_idx').on(cc.contentId),
    contributionTypeIdIdx: index('contributionTypeId_idx').on(cc.contributionTypeId),
  }),
)

export const contentContributionRelations = relations(contentContributions, ({ one }) => ({
  user: one(users, { fields: [contentContributions.userId], references: [users.id] }),
  content: one(contentResource, { fields: [contentContributions.contentId], references: [contentResource.id] }),
  contributionType: one(contributionTypes, {
    fields: [contentContributions.contributionTypeId],
    references: [contributionTypes.id],
  }),
}))

export const contributionTypes = mysqlTable(
  'contributionType',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (ct) => ({
    nameIdx: index('name_idx').on(ct.name),
    slugIdx: index('slug_idx').on(ct.slug),
  }),
)

export const contributionTypesRelations = relations(contributionTypes, ({ many }) => ({
  contributions: many(contentContributions),
}))

export const contentResource = mysqlTable(
  'contentResource',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    type: varchar('type', { length: 255 }).notNull(),
    createdById: varchar('createdById', { length: 255 }).notNull(),
    fields: json('fields').$type<Record<string, any>>().default({}),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (cm) => ({
    typeIdx: index('type_idx').on(cm.type),
    createdByIdx: index('createdById_idx').on(cm.createdById),
    createdAtIdx: index('createdAt_idx').on(cm.createdAt),
  }),
)

export const contentResourceRelations = relations(contentResource, ({ one, many }) => ({
  createdBy: one(users, { fields: [contentResource.createdById], references: [users.id] }),
  contributions: many(contentContributions),
  resources: many(contentResourceResource, { relationName: 'resource' }),
  resourceOf: many(contentResourceResource, { relationName: 'resourceOf' }),
}))

export const contentResourceResource = mysqlTable(
  'contentResourceResource',
  {
    resourceOfId: varchar('resourceOfId', { length: 255 }).notNull(),
    resourceId: varchar('resourceId', { length: 255 }).notNull(),
    position: double('position').notNull().default(0),
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
    pk: primaryKey({ columns: [crr.resourceOfId, crr.resourceId] }),
    contentResourceIdIdx: index('contentResourceId_idx').on(crr.resourceOfId),
    resourceIdIdx: index('resourceId_idx').on(crr.resourceId),
  }),
)

export const contentResourceResourceRelations = relations(contentResourceResource, ({ one }) => ({
  resourceOf: one(contentResource, {
    fields: [contentResourceResource.resourceOfId],
    references: [contentResource.id],
    relationName: 'resourceOf',
  }),
  resource: one(contentResource, {
    fields: [contentResourceResource.resourceId],
    references: [contentResource.id],
    relationName: 'resource',
  }),
}))

export const communicationPreferenceTypes = mysqlTable('communicationPreferenceType', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    fsp: 3,
  }).default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    fsp: 3,
  }),
  deletedAt: timestamp('deletedAt', {
    mode: 'date',
    fsp: 3,
  }),
})

export const communicationChannel = mysqlTable(
  'communicationChannel',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (cc) => ({
    nameIdx: index('name_idx').on(cc.name),
  }),
)

export const communicationPreferences = mysqlTable(
  'communicationPreference',
  {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    userId: varchar('userId', { length: 255 }).notNull(),
    channelId: varchar('channelId', { length: 255 }).notNull(),
    preferenceLevel: mysqlEnum('preferenceLevel', ['low', 'medium', 'high']).notNull().default('medium'),
    preferenceTypeId: varchar('preferenceTypeId', { length: 255 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    optInAt: timestamp('optInAt', {
      mode: 'date',
      fsp: 3,
    }),
    optOutAt: timestamp('optOutAt', {
      mode: 'date',
      fsp: 3,
    }),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      fsp: 3,
    }),
    deletedAt: timestamp('deletedAt', {
      mode: 'date',
      fsp: 3,
    }),
  },
  (cp) => ({
    userIdIdx: index('userId_idx').on(cp.userId),
    preferenceTypeIdx: index('preferenceTypeId_idx').on(cp.preferenceTypeId),
    channelIdIdx: index('channelId_idx').on(cp.channelId),
  }),
)

export const communicationPreferencesRelations = relations(communicationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [communicationPreferences.userId],
    references: [users.id],
  }),
  channel: one(communicationChannel, {
    fields: [communicationPreferences.channelId],
    references: [communicationChannel.id],
  }),
  preferenceType: one(communicationPreferenceTypes, {
    fields: [communicationPreferences.preferenceTypeId],
    references: [communicationPreferenceTypes.id],
  }),
}))

export const accounts = mysqlTable(
  'account',
  {
    userId: varchar('userId', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }).$type<AdapterAccount['type']>().notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    oauth_token: text('oauth_token'),
    oauth_token_secret: text('oauth_token_secret'),
    expires_at: int('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
    refresh_token_expires_in: int('refresh_token_expires_in'),
  },
  (account) => ({
    pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
    userIdIdx: index('userId_idx').on(account.userId),
  }),
)

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessions = mysqlTable(
  'session',
  {
    sessionToken: varchar('sessionToken', { length: 255 }).notNull().primaryKey(),
    userId: varchar('userId', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (session) => ({
    userIdIdx: index('userId_idx').on(session.userId),
  }),
)

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const verificationTokens = mysqlTable(
  'verificationToken',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
)
