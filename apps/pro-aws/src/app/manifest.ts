import { MetadataRoute } from 'next'
import config from '@/config'

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: config.defaultTitle,
		short_name: 'Pro AWS',
		description: config.description,
		start_url: '/',
		display: 'standalone',
		icons: [
			{
				src: '/favicon.ico',
				sizes: 'any',
				type: 'image/x-icon',
			},
		],
	}
}
