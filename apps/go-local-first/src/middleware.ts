import { NextResponse } from 'next/server'

import { auth } from './server/auth'

type Role = {
	id: string
	organizationId: string | null
	name: string
	description: string | null
	active: boolean
	createdAt: string
	updatedAt: string
	deletedAt: string | null
}

type ReqUser = {
	id: string
	name: string
	role: string
	email: string
	fields: Record<string, any>
	emailVerified: '2025-08-13T21:03:33.891Z'
	image: null
	createdAt: '2025-04-29T22:11:12.094Z'
	roles: Role[]
}

export default auth(async function middleware(req) {
	const user = req.auth?.user as ReqUser | undefined
	const isAdmin = user?.roles?.some((role) => role.name === 'admin')
	const pathname = req.nextUrl.pathname
	if (pathname === '/admin' || pathname.startsWith('/admin/')) {
		if (!user || !isAdmin) {
			return NextResponse.rewrite(new URL('/not-found', req.url))
		}
	}

	return NextResponse.next()
})

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|_axiom/web-vitals|sitemap.xml|robots.txt).*)',
	],
}
