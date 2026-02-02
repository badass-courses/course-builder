import { MetadataRoute } from 'next'
import { env } from '@/env.mjs'

export default function robots(): MetadataRoute.Robots {
	const exclude = [
		'/confirm',
		'/confirmed',
		'/excited',
		'/redirect',
		'/unsubscribed',
		'/answer',
		'/login',
		'/thanks',
		'/welcome',
		'/team',
		'/error',
		'/check-your-email',
		'/progress',
	]
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
			},
			...exclude.map((path) => ({
				userAgent: '*',
				disallow: path,
			})),
		],
		sitemap: [
			env.NEXT_PUBLIC_URL + '/sitemap.xml',
			env.NEXT_PUBLIC_URL + '/sitemap.md',
		],
	}
}
