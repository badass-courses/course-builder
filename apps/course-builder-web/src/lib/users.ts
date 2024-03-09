import { UserSchema } from '@/ability'
import { db } from '@/db'
import { roles, userRoles, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const loadUsersForRole = async (role: string) => {
  const usersByRole = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      role: roles.name,
    })
    .from(users)
    .rightJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(roles.name, role))

  return z.array(UserSchema).parse(usersByRole)
}
