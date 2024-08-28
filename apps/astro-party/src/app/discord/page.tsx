import { redirect } from 'next/navigation'
import { env } from '@/env.mjs'

export default async function Discord() {
	redirect(env.NEXT_PUBLIC_DISCORD_INVITE_URL)
}
