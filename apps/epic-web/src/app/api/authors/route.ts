import { NextResponse } from 'next/server'
import { loadUsersByDirectRole, loadUsersForRole } from '@/lib/users'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const { session } = await getServerAuthSession()

		if (!session?.user) {
			return new NextResponse('Unauthorized', { status: 401 })
		}

		const userRoles = session.user.roles || []
		const isAdmin = userRoles.some((role) => role.name === 'admin')

		if (!isAdmin) {
			return new NextResponse('Forbidden', { status: 403 })
		}

		const [admins, contributorsViaRoleTable, contributorsDirect] =
			await Promise.all([
				loadUsersForRole('admin'),
				loadUsersForRole('contributor'),
				loadUsersByDirectRole('contributor'),
			])

		const contributors = [...contributorsViaRoleTable, ...contributorsDirect]

		// merge unique by id
		const usersMap = new Map<string, any>()
		;[...admins, ...contributors].forEach((user) => {
			usersMap.set(user.id, user)
		})

		const authors = Array.from(usersMap.values()).map((u) => ({
			...u,
			displayName: u.name || u.email || u.id,
		}))

		return NextResponse.json({ authors })
	} catch (error) {
		console.error('Error fetching authors', error)
		return new NextResponse('Internal Server Error', { status: 500 })
	}
}
