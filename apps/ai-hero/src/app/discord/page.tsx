import { notFound, redirect } from 'next/navigation'
import { env } from '@/env.mjs'

export default async function Discord() {
	if (env.NEXT_PUBLIC_DISCORD_INVITE_URL === undefined) {
		console.error('Discord invite URL is not set')
		return notFound()
	}
	redirect(env.NEXT_PUBLIC_DISCORD_INVITE_URL)
}
