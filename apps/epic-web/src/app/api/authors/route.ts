import { NextResponse } from 'next/server'
import { getAuthors } from '@/lib/users'
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

		const authors = await getAuthors()

		return NextResponse.json(
			{ authors },
			{ headers: { 'Cache-Control': 'no-store' } },
		)
	} catch (error) {
		console.error('Error fetching authors', error)
		return new NextResponse('Internal Server Error', { status: 500 })
	}
}
