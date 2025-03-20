import { db } from '@/db'
import { roles, userRoles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const addRoleToUser = async (userId: string, roleName: string) => {
	const role = await db.query.roles.findFirst({
		where: eq(roles.name, roleName),
	})

	if (!role) {
		throw new Error(`Role "${roleName}" not found`)
	}

	const existingUserRole = await db.query.userRoles.findFirst({
		where: (ur, { and, eq }) =>
			and(eq(ur.userId, userId), eq(ur.roleId, role.id)),
	})

	if (existingUserRole) {
		return existingUserRole
	}

	return await db.insert(userRoles).values({
		id: `user_role_${nanoid()}`,
		userId,
		roleId: role.id,
	})
}
