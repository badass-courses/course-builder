import type { AdapterAccount, AdapterSession, AdapterUser } from '@auth/core/adapters'
import { addSeconds, isAfter } from 'date-fns'
import { and, eq, sql } from 'drizzle-orm'
import {
  mysqlTable as defaultMySqlTableFn,
  double,
  index,
  int,
  json,
  MySqlDatabase,
  mysqlEnum,
  MySqlTableFn,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'

import { type CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import { VideoResourceSchema } from '@coursebuilder/core/schemas/video-resource'

export function createTables(mySqlTable: MySqlTableFn) {
  const users = mySqlTable('user', {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    role: mysqlEnum('role', ['user', 'admin']).default('user'),
    emailVerified: timestamp('emailVerified', {
      mode: 'date',
      fsp: 3,
    }).defaultNow(),
    image: varchar('image', { length: 255 }),
  })

  const accounts = mySqlTable(
    'account',
    {
      userId: varchar('userId', { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      type: varchar('type', { length: 255 }).$type<AdapterAccount['type']>().notNull(),
      provider: varchar('provider', { length: 255 }).notNull(),
      providerAccountId: varchar('providerAccountId', {
        length: 255,
      }).notNull(),
      refresh_token: varchar('refresh_token', { length: 255 }),
      access_token: varchar('access_token', { length: 255 }),
      expires_at: int('expires_at'),
      token_type: varchar('token_type', { length: 255 }),
      scope: varchar('scope', { length: 255 }),
      id_token: varchar('id_token', { length: 255 }),
      session_state: varchar('session_state', { length: 255 }),
    },
    (account) => ({
      pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
      userIdIdx: index('userId_idx').on(account.userId),
    }),
  )

  const sessions = mySqlTable(
    'session',
    {
      sessionToken: varchar('sessionToken', { length: 255 }).notNull().primaryKey(),
      userId: varchar('userId', { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      expires: timestamp('expires', { mode: 'date' }).notNull(),
    },
    (session) => ({
      userIdIdx: index('userId_idx').on(session.userId),
    }),
  )

  const verificationTokens = mySqlTable(
    'verificationToken',
    {
      identifier: varchar('identifier', { length: 255 }).notNull(),
      token: varchar('token', { length: 255 }).notNull(),
      expires: timestamp('expires', { mode: 'date' }).notNull(),
      createdAt: timestamp('createdAt', {
        mode: 'date',
        fsp: 3,
      }).default(sql`CURRENT_TIMESTAMP(3)`),
    },
    (vt) => ({
      pk: primaryKey({ columns: [vt.identifier, vt.token] }),
    }),
  )

  const contentResource = mySqlTable(
    'contentResource',
    {
      id: varchar('id', { length: 255 }).notNull().primaryKey(),
      type: varchar('type', { length: 255 }).notNull(),
      createdById: varchar('createdById', { length: 255 }).notNull(),
      fields: json('fields').$type<Record<string, any>>().default({}),
      createdAt: timestamp('createdAt', {
        mode: 'date',
        fsp: 3,
      }).defaultNow(),
      updatedAt: timestamp('updatedAt', {
        mode: 'date',
        fsp: 3,
      }).defaultNow(),
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

  const contentResourceResource = mySqlTable(
    'contentResourceResource',
    {
      resourceOfId: varchar('resourceOfId', { length: 255 }).notNull(),
      resourceId: varchar('resourceId', { length: 255 }).notNull(),
      position: double('position').notNull().default(0),
      metadata: json('fields').$type<Record<string, any>>().default({}),
      createdAt: timestamp('createdAt', {
        mode: 'date',
        fsp: 3,
      }).defaultNow(),
      updatedAt: timestamp('updatedAt', {
        mode: 'date',
        fsp: 3,
      }).defaultNow(),
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

  return { users, accounts, sessions, verificationTokens, contentResource, contentResourceResource }
}

export type DefaultSchema = ReturnType<typeof createTables>

export function mySqlDrizzleAdapter(
  client: InstanceType<typeof MySqlDatabase>,
  tableFn = defaultMySqlTableFn,
): CourseBuilderAdapter {
  const { users, accounts, sessions, verificationTokens, contentResource } = createTables(tableFn)

  return {
    async updateContentResourceFields(options) {
      if (!options.id) {
        throw new Error('No content resource id.')
      }

      const currentResource = await client
        .select()
        .from(contentResource)
        .where(eq(contentResource.id, options.id))
        .then((res) => res[0])

      await client
        .update(contentResource)
        .set({ fields: { ...currentResource.fields, ...options.fields } })
        .where(eq(contentResource.id, options.id))

      return await client
        .select()
        .from(contentResource)
        .where(eq(contentResource.id, options.id))
        .then((res) => res[0])
    },
    async getVideoResource(id) {
      if (!id) {
        throw new Error('videoResourceId is required')
      }

      const query = sql`
    SELECT
      id as _id,
      CAST(updatedAt AS DATETIME) as _updatedAt,
      CAST(createdAt AS DATETIME) as _createdAt,
      JSON_EXTRACT (${contentResource.fields}, "$.state") AS state,
      JSON_EXTRACT (${contentResource.fields}, "$.duration") AS duration,
      JSON_EXTRACT (${contentResource.fields}, "$.muxPlaybackId") AS muxPlaybackId,
      JSON_EXTRACT (${contentResource.fields}, "$.muxAssetId") AS muxAssetId,
      JSON_EXTRACT (${contentResource.fields}, "$.transcript") AS transcript
    FROM
      ${contentResource}
    WHERE
      type = 'videoResource'
      AND (id = ${id});
      
 `
      return client
        .execute(query)
        .then((result: any) => {
          const parsedResource = VideoResourceSchema.safeParse(result.rows[0])
          return parsedResource.success ? parsedResource.data : null
        })
        .catch((error) => {
          console.error(error)
          return error
        })
    },
    async createContentResource(data) {
      const id = data.id || crypto.randomUUID()

      await client.insert(contentResource).values({ ...data, id })

      return await client
        .select()
        .from(contentResource)
        .where(eq(contentResource.id, id))
        .then((res) => res[0])
    },
    async getContentResource(data) {
      const thing =
        (await client
          .select()
          .from(contentResource)
          .where(eq(contentResource.id, data))
          .then((res) => res[0])) ?? null

      return thing
    },
    async createUser(data) {
      const id = crypto.randomUUID()

      await client.insert(users).values({ ...data, id })

      return await client
        .select()
        .from(users)
        .where(eq(users.id, id))
        .then((res) => res[0] as AdapterUser)
    },
    async getUser(data) {
      const thing =
        (await client
          .select()
          .from(users)
          .where(eq(users.id, data))
          .then((res) => res[0])) ?? null

      return thing
    },
    async getUserByEmail(data) {
      const user =
        (await client
          .select()
          .from(users)
          .where(eq(users.email, data))
          .then((res) => res[0])) ?? null

      return user
    },
    async createSession(data) {
      await client.insert(sessions).values(data)

      return await client
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, data.sessionToken))
        .then((res) => res[0] as AdapterSession)
    },
    async getSessionAndUser(data) {
      const sessionAndUser =
        (await client
          .select({
            session: sessions,
            user: users,
          })
          .from(sessions)
          .where(eq(sessions.sessionToken, data))
          .innerJoin(users, eq(users.id, sessions.userId))
          .then((res) => res[0])) ?? null

      return sessionAndUser
    },
    async updateUser(data) {
      if (!data.id) {
        throw new Error('No user id.')
      }

      await client.update(users).set(data).where(eq(users.id, data.id))

      return await client
        .select()
        .from(users)
        .where(eq(users.id, data.id))
        .then((res) => res[0] as AdapterUser)
    },
    async updateSession(data) {
      await client.update(sessions).set(data).where(eq(sessions.sessionToken, data.sessionToken))

      return await client
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, data.sessionToken))
        .then((res) => res[0])
    },
    async linkAccount(rawAccount) {
      await client.insert(accounts).values(rawAccount)
    },
    async getUserByAccount(account) {
      const dbAccount =
        (await client
          .select()
          .from(accounts)
          .where(
            and(eq(accounts.providerAccountId, account.providerAccountId), eq(accounts.provider, account.provider)),
          )
          .leftJoin(users, eq(accounts.userId, users.id))
          .then((res) => res[0])) ?? null

      if (!dbAccount) {
        return null
      }

      return dbAccount.user
    },
    async deleteSession(sessionToken) {
      const session =
        (await client
          .select()
          .from(sessions)
          .where(eq(sessions.sessionToken, sessionToken))
          .then((res) => res[0])) ?? null

      await client.delete(sessions).where(eq(sessions.sessionToken, sessionToken))

      return session
    },
    async createVerificationToken(token) {
      await client.insert(verificationTokens).values(token)

      return await client
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.identifier, token.identifier))
        .then((res) => res[0])
    },
    async useVerificationToken(token) {
      try {
        const deletedToken =
          (await client
            .select()
            .from(verificationTokens)
            .where(and(eq(verificationTokens.identifier, token.identifier), eq(verificationTokens.token, token.token)))
            .then((res) => res[0])) ?? null

        if (deletedToken?.createdAt) {
          const TIMEOUT_IN_SECONDS = 90
          const expireMultipleClicks = addSeconds(deletedToken.createdAt, TIMEOUT_IN_SECONDS)
          const now = new Date()

          if (isAfter(expireMultipleClicks, now)) {
            // @ts-ignore
            const { id: _, ...verificationToken } = token
            return deletedToken
          } else {
            await client
              .delete(verificationTokens)
              .where(
                and(eq(verificationTokens.identifier, token.identifier), eq(verificationTokens.token, token.token)),
              )
            return deletedToken
          }
        }

        return deletedToken
      } catch (err) {
        throw new Error('No verification token found.')
      }
    },
    async deleteUser(id) {
      const user = await client
        .select()
        .from(users)
        .where(eq(users.id, id))
        .then((res) => res[0] ?? null)

      await client.delete(users).where(eq(users.id, id))

      return user
    },
    async unlinkAccount(account) {
      await client
        .delete(accounts)
        .where(and(eq(accounts.providerAccountId, account.providerAccountId), eq(accounts.provider, account.provider)))

      return undefined
    },
  }
}
