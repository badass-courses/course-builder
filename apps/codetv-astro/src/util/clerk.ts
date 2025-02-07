import { eq, inArray } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import { User } from '@coursebuilder/core/schemas/user-schema'

import { db } from '../db'
import { users } from '../db/schema'

export async function loadUsersByIDs(ids: Array<string>) {
	const result = await db.query.users.findMany({
		where: inArray(users.id, ids),
	})

	return result
}

/**
 *
 * @param username TODO: noop, fix
 * @returns
 */
export async function getUserByUsername(username: string) {
	return null
}

export async function createUser(user: Omit<User, 'id'>) {
	try {
		const id: string = guid()
		await db.insert(users).values({
			id,
			...user,
		})
		const result = await db.query.users.findFirst({
			where: eq(users.id, id),
		})
		return result
	} catch (error) {
		console.error(error)
		return null
	}
}
