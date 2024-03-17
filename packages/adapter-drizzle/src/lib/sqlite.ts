import type { Adapter, AdapterAccount } from '@auth/core/adapters'
import { and, eq, sql } from 'drizzle-orm'
import {
  BaseSQLiteDatabase,
  sqliteTable as defaultSqliteTableFn,
  integer,
  primaryKey,
  SQLiteTableFn,
  text,
} from 'drizzle-orm/sqlite-core'

import { CourseBuilderAdapter } from '@coursebuilder/core/adapters'

import { stripUndefined } from './utils.js'

export function createTables(sqliteTable: SQLiteTableFn) {
  const users = sqliteTable('user', {
    id: text('id').notNull().primaryKey(),
    name: text('name'),
    email: text('email').notNull(),
    emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
    image: text('image'),
  })

  const accounts = sqliteTable(
    'account',
    {
      userId: text('userId')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      type: text('type').$type<AdapterAccount['type']>().notNull(),
      provider: text('provider').notNull(),
      providerAccountId: text('providerAccountId').notNull(),
      refresh_token: text('refresh_token'),
      access_token: text('access_token'),
      expires_at: integer('expires_at'),
      token_type: text('token_type'),
      scope: text('scope'),
      id_token: text('id_token'),
      session_state: text('session_state'),
    },
    (account) => ({
      pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
    }),
  )

  const sessions = sqliteTable('session', {
    sessionToken: text('sessionToken').notNull().primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
  })

  const verificationTokens = sqliteTable(
    'verificationToken',
    {
      identifier: text('identifier').notNull(),
      token: text('token').notNull(),
      expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
    },
    (vt) => ({
      pk: primaryKey({ columns: [vt.identifier, vt.token] }),
    }),
  )

  const contentResource = sqliteTable('contentResource', {
    id: text('id', { length: 255 }).notNull().primaryKey(),
    type: text('type', { length: 255 }).notNull(),
    createdById: text('createdById', { length: 255 }).notNull(),
    fields: text('metadata', { mode: 'json' }).$type<Record<string, any>>().default({}),
    createdAt: integer('createdAt', {
      mode: 'timestamp',
    }).default(sql`CURRENT_TIME`),
    updatedAt: integer('updatedAt', {
      mode: 'timestamp',
    }).default(sql`CURRENT_TIME`),
    deletedAt: integer('deletedAt', {
      mode: 'timestamp',
    }),
  })

  const contentResourceResource = sqliteTable(
    'contentResourceResource',
    {
      resourceOfId: text('resourceOfId', { length: 255 }).notNull(),
      resourceId: text('resourceId', { length: 255 }).notNull(),
      position: integer('position').notNull().default(0),
      metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>().default({}),
      createdAt: integer('createdAt', {
        mode: 'timestamp',
      }).default(sql`CURRENT_TIME`),
      updatedAt: integer('updatedAt', {
        mode: 'timestamp',
      }).default(sql`CURRENT_TIME`),
      deletedAt: integer('deletedAt', {
        mode: 'timestamp',
      }),
    },
    (crr) => ({
      pk: primaryKey({ columns: [crr.resourceOfId, crr.resourceId] }),
    }),
  )

  return { users, accounts, sessions, verificationTokens, contentResource, contentResourceResource }
}

export type DefaultSchema = ReturnType<typeof createTables>

export function SQLiteDrizzleAdapter(
  client: InstanceType<typeof BaseSQLiteDatabase>,
  tableFn = defaultSqliteTableFn,
): CourseBuilderAdapter {
  const { users, accounts, sessions, verificationTokens, contentResource } = createTables(tableFn)

  return {
    async createContentResource(resource) {
      return client
        .insert(contentResource)
        .values({ ...resource, id: crypto.randomUUID() })
        .returning()
        .get()
    },
    async getContentResource(data) {
      const result = await client.select().from(contentResource).where(eq(contentResource.id, data)).get()
      return result ?? null
    },
    async createUser(data) {
      return client
        .insert(users)
        .values({ ...data, id: crypto.randomUUID() })
        .returning()
        .get()
    },
    async getUser(data) {
      const result = await client.select().from(users).where(eq(users.id, data)).get()
      return result ?? null
    },
    async getUserByEmail(data) {
      const result = await client.select().from(users).where(eq(users.email, data)).get()
      return result ?? null
    },
    createSession(data) {
      return client.insert(sessions).values(data).returning().get()
    },
    async getSessionAndUser(data) {
      const result = await client
        .select({ session: sessions, user: users })
        .from(sessions)
        .where(eq(sessions.sessionToken, data))
        .innerJoin(users, eq(users.id, sessions.userId))
        .get()
      return result ?? null
    },
    async updateUser(data) {
      if (!data.id) {
        throw new Error('No user id.')
      }

      const result = await client.update(users).set(data).where(eq(users.id, data.id)).returning().get()
      return result ?? null
    },
    async updateSession(data) {
      const result = await client
        .update(sessions)
        .set(data)
        .where(eq(sessions.sessionToken, data.sessionToken))
        .returning()
        .get()
      return result ?? null
    },
    async linkAccount(rawAccount) {
      return stripUndefined(await client.insert(accounts).values(rawAccount).returning().get())
    },
    async getUserByAccount(account) {
      const results = await client
        .select()
        .from(accounts)
        .leftJoin(users, eq(users.id, accounts.userId))
        .where(and(eq(accounts.provider, account.provider), eq(accounts.providerAccountId, account.providerAccountId)))
        .get()

      if (!results) {
        return null
      }
      return Promise.resolve(results).then((results) => results.user)
    },
    async deleteSession(sessionToken) {
      const result = await client.delete(sessions).where(eq(sessions.sessionToken, sessionToken)).returning().get()
      return result ?? null
    },
    async createVerificationToken(token) {
      const result = await client.insert(verificationTokens).values(token).returning().get()
      return result ?? null
    },
    async useVerificationToken(token) {
      try {
        const result = await client
          .delete(verificationTokens)
          .where(and(eq(verificationTokens.identifier, token.identifier), eq(verificationTokens.token, token.token)))
          .returning()
          .get()
        return result ?? null
      } catch (err) {
        throw new Error('No verification token found.')
      }
    },
    async deleteUser(id) {
      const result = await client.delete(users).where(eq(users.id, id)).returning().get()
      return result ?? null
    },
    async unlinkAccount(account) {
      await client
        .delete(accounts)
        .where(and(eq(accounts.providerAccountId, account.providerAccountId), eq(accounts.provider, account.provider)))
        .run()
    },
  }
}
