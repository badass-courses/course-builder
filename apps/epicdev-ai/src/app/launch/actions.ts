'use server'

import 'server-only'

import { COMMERCE_ENABLED } from '@/flags/flag-definitions'

import { toggleFlag } from '../admin/flags/actions'

export async function launch() {
	await toggleFlag(COMMERCE_ENABLED, true).catch((e) => {
		console.error(e)
	})

	await fetch(`${process.env.NEXT_PUBLIC_PARTY_KIT_URL}/party/launch`, {
		method: 'POST',
		body: JSON.stringify({
			name: 'launch.initiated',
		}),
	})
		.then((res) => {
			return res.text()
		})
		.catch((e) => {
			console.error(e)
		})

	return { success: 'LAUNCH!' }
}
