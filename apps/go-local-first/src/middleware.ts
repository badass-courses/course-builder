import { NextResponse } from 'next/server'

import { auth } from './server/auth'

export default auth(async function middleware(req) {
	const user = req.auth?.user as any | undefined
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
