import {relations, sql} from 'drizzle-orm'
import {
  bigint,
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'
import {type AdapterAccount} from 'next-auth/adapters'

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
    id: varchar('id', {length: 255}).notNull().primaryKey(),
    name: varchar('name', {length: 255}),
    role: mysqlEnum('role', ['user', 'admin']).default('user'),
    email: varchar('email', {length: 255}).notNull(),
    emailVerified: timestamp('emailVerified', {
      mode: 'date',
      fsp: 3,
    }),
    image: varchar('image', {length: 255}),
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

export const usersRelations = relations(users, ({many}) => ({
  accounts: many(accounts),
  communicationPreferences: many(communicationPreferences),
}))

export const communicationPreferenceTypes = mysqlTable(
  'communicationPreferenceType',
  {
    id: varchar('id', {length: 255}).notNull().primaryKey(),
    name: varchar('name', {length: 255}).notNull(),
    description: text('description'),
    status: boolean('status').notNull().default(true),
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
)

export const communicationChannel = mysqlTable(
  'communicationChannel',
  {
    id: varchar('id', {length: 255}).notNull().primaryKey(),
    name: varchar('name', {length: 255}).notNull(),
    description: text('description'),
    status: boolean('status').notNull().default(true),
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
    id: varchar('id', {length: 255}).notNull().primaryKey(),
    userId: varchar('userId', {length: 255}).notNull(),
    channelId: varchar('channelId', {length: 255}).notNull(),
    preferenceTypeId: varchar('preferenceTypeId', {length: 255}).notNull(),
    status: boolean('status').notNull().default(true),
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
  (cp) => ({
    userIdIdx: index('userId_idx').on(cp.userId),
    preferenceTypeIdx: index('preferenceTypeId_idx').on(cp.preferenceTypeId),
    channelIdIdx: index('channelId_idx').on(cp.channelId),
  }),
)

export const communicationPreferencesRelations = relations(
  communicationPreferences,
  ({one}) => ({
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
  }),
)

export const accounts = mysqlTable(
  'account',
  {
    userId: varchar('userId', {length: 255}).notNull(),
    type: varchar('type', {length: 255})
      .$type<AdapterAccount['type']>()
      .notNull(),
    provider: varchar('provider', {length: 255}).notNull(),
    providerAccountId: varchar('providerAccountId', {length: 255}).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: int('expires_at'),
    token_type: varchar('token_type', {length: 255}),
    scope: varchar('scope', {length: 255}),
    id_token: text('id_token'),
    session_state: varchar('session_state', {length: 255}),
    refresh_token_expires_in: int('refresh_token_expires_in'),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
    userIdIdx: index('userId_idx').on(account.userId),
  }),
)

export const accountsRelations = relations(accounts, ({one}) => ({
  user: one(users, {fields: [accounts.userId], references: [users.id]}),
}))

export const sessions = mysqlTable(
  'session',
  {
    sessionToken: varchar('sessionToken', {length: 255}).notNull().primaryKey(),
    userId: varchar('userId', {length: 255}).notNull(),
    expires: timestamp('expires', {mode: 'date'}).notNull(),
  },
  (session) => ({
    userIdIdx: index('userId_idx').on(session.userId),
  }),
)

export const sessionsRelations = relations(sessions, ({one}) => ({
  user: one(users, {fields: [sessions.userId], references: [users.id]}),
}))

export const verificationTokens = mysqlTable(
  'verificationToken',
  {
    identifier: varchar('identifier', {length: 255}).notNull(),
    token: varchar('token', {length: 255}).notNull(),
    expires: timestamp('expires', {mode: 'date'}).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  }),
)
