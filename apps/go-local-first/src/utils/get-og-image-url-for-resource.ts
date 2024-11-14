import { env } from '@/env.mjs'

export const getOGImageUrlForResource = (resource: {
	fields?: { slug: string }
	id: string
	updatedAt?: Date | string | null
}) => {
	const updatedAt =
		typeof resource.updatedAt === 'string'
			? resource.updatedAt
			: resource.updatedAt?.toISOString()

	return `${env.NEXT_PUBLIC_URL}/api/og?resource=${resource?.fields?.slug || resource.id}${updatedAt ? `&updatedAt=${encodeURI(updatedAt)}` : ''}`
}
