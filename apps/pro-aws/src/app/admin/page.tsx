import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { db } from '@/db'
import { roles, userRoles, users as usersTable } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import { Button } from '@coursebuilder/ui'

export default async function AdminPage() {
	const { ability } = await getServerAuthSession()

	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	const users = await db.query.users.findMany({
		with: {
			roles: {
				with: {
					role: true,
				},
			},
		},
	})

	const handleMakeAdmin = async (formData: any) => {
		'use server'
		const { ability } = await getServerAuthSession()

		if (!ability.can('manage', 'all')) {
			console.error('🚫 Not Authorized')
			return
		}
		const userId = formData.get('id')
		const adminRole = await db.query.roles.findFirst({
			where: eq(roles.name, 'admin'),
		})

		if (!adminRole) {
			console.error('🚫 Admin role not found')
			return
		}

		const user = await db.query.users.findFirst({
			where: eq(usersTable.id, userId),
			with: {
				roles: {
					with: {
						role: true,
					},
				},
			},
		})

		if (!user) {
			console.error('🚫 User not found')
			return
		}

		if (user.roles?.map((role) => role.role.name).includes('admin')) {
			console.debug('🚫 User is already admin')
			return
		}

		await db.insert(userRoles).values({
			roleId: adminRole.id,
			userId: user.id,
		})

		revalidatePath('/admin')
	}

	return (
		<Layout>
			<div className={`flex flex-col gap-4 p-4`}>
				{users.map((user) => (
					<div key={user.id}>
						{user.email} [{user.roles?.map((role) => role.role.name).join(', ')}
						]
						<div>
							<form action={handleMakeAdmin}>
								<input type="hidden" name="id" value={user.id} />
								<Button type="submit">Make Admin</Button>
							</form>
						</div>
					</div>
				))}
			</div>
		</Layout>
	)
}
