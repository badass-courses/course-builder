import { NextResponse, type NextRequest } from 'next/server'

import { getServerAuthSession } from './server/auth'

/**
 * Middleware to protect admin routes. Redirects non-admin users away from `/admin`.
 */
export default async function middleware(req: NextRequest) {
	const pathname = req.nextUrl.pathname
	if (pathname === '/admin' || pathname.startsWith('/admin/')) {
		const { ability } = await getServerAuthSession()
		if (ability.cannot('manage', 'all')) {
			return NextResponse.rewrite(new URL('/not-found', req.url))
		} else {
			if (pathname === '/admin') {
				return NextResponse.redirect(new URL('/admin/dashboard', req.url))
			}
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|_axiom/web-vitals|sitemap.xml|robots.txt).*)',
	],
}
