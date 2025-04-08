import { log } from './logger'
import { redis } from './redis-client'

const SHORTLINK_URL_PREFIX = 'https://github.com/ai-hero-dev/ai-hero/tree/main/'

export async function getShortlinkUrl(key: string, userId?: string) {
	await log.info('shortlink.lookup.started', { key, userId })

	const url = await redis.get(`shortlink:${key}`)
	if (!url) {
		await log.warn('shortlink.lookup.not_found', { key })
		return null
	}

	await log.info('shortlink.lookup.success', { key })
	return `${SHORTLINK_URL_PREFIX}${url}`
}
