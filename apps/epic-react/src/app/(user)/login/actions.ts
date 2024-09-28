'use server'

import { headers } from 'next/headers'
import { env } from '@/env.mjs'

export async function getCsrf() {
	const headerStore = headers()
	const cookie = headerStore.get('cookie')
	const options: RequestInit = {
		headers: {
			...(cookie ? { cookie } : {}),
		},
		cache: 'no-cache',
	}
	console.log('csrf url', `${env.COURSEBUILDER_URL}/api/auth/csrf`)

	return await fetch(`${env.COURSEBUILDER_URL}/api/auth/csrf`, options)
		.then(async (res) => {
			const resonseText = await res.text()
			const { csrfToken } = JSON.parse(resonseText)
			return csrfToken
		})
		.catch((e) => {
			console.log(e)
			throw e
		})
}
