import { MetadataRoute } from 'next'
import { env } from '@/env.mjs'

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: env.NEXT_PUBLIC_URL,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1,
		},
	]
}
