import { NextResponse } from 'next/server'

import { getServerAuthSession } from './server/auth'

export default async function middleware(req) {
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
