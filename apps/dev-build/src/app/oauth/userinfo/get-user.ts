import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getUser(userId: string | null) {
	if (!userId) {
		return null
	}
	return db.query.users.findFirst({
		where: eq(users.id, userId),
	})
}
