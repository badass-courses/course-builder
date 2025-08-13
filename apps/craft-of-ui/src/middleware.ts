import { NextResponse } from 'next/server'

import { auth } from './server/auth'
import { AuthUser, determineOrgAccess } from './utils/determine-org-access'

const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge: 60 * 60 * 24 * 90,
	path: '/',
} as const

export default auth(async function middleware(req) {
	const user = req.auth?.user as AuthUser | undefined
	const isAdmin = user?.roles?.some((role) => role.name === 'admin')
	const pathname = req.nextUrl.pathname
	if (pathname === '/admin' || pathname.startsWith('/admin/')) {
		if (!user || isAdmin) {
			return NextResponse.rewrite(new URL('/not-found', req.url))
		} else {
			if (pathname === '/admin') {
				return NextResponse.redirect(new URL('/admin/dashboard', req.url))
			}
		}
	}
	if (!user) return NextResponse.next()

	const currentOrgId = req.cookies.get('organizationId')?.value
	const response = NextResponse.next()

	const result = determineOrgAccess(user.organizationRoles, currentOrgId)

	if (result.action === 'REDIRECT_TO_ORG_LIST') {
		return NextResponse.redirect(new URL('/organization-list', req.url))
	}

	if (result.action === 'SET_OWNER_ORG' && result.organizationId) {
		response.cookies.set(
			'organizationId',
			result.organizationId,
			COOKIE_OPTIONS,
		)
		response.headers.set('x-organization-id', result.organizationId)
		return response
	}

	if (result.organizationId) {
		response.headers.set('x-organization-id', result.organizationId)
	}

	return response
})

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|_axiom/web-vitals|sitemap.xml|robots.txt).*)',
	],
}
