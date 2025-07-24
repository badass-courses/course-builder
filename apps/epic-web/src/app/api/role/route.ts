import { NextResponse } from 'next/server'
import { getCurrentUserRoles, getUserByEmail } from '@/lib/users'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const { session } = await getServerAuthSession()

		if (!session?.user || !session.user.email) {
			return new NextResponse('Unauthorized', { status: 401 })
		}

		// we still need to check if the user exists to return the correct
		// error code
		const user = await getUserByEmail(session.user.email)
		if (!user) {
			return new NextResponse('User not found', { status: 404 })
		}

		const roles = await getCurrentUserRoles()

		return NextResponse.json(
			{ roles },
			{ headers: { 'Cache-Control': 'no-store' } },
		)
	} catch (error) {
		console.error('Error fetching user role', error)
		return new NextResponse('Internal Server Error', { status: 500 })
	}
}
