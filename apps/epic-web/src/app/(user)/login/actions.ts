'use server'

import { headers } from 'next/headers'
import { env } from '@/env.mjs'

export async function getCsrf() {
	const headerStore = await headers()
	const cookie = headerStore.get('cookie')
	const options: RequestInit = {
		headers: {
			...(cookie ? { cookie } : {}),
		},
		cache: 'no-cache',
	}
	return await fetch(`${env.COURSEBUILDER_URL}/api/auth/csrf`, options)
		.then(async (res) => {
			const resonseText = await res.text()
			if (!resonseText) {
				return null
			}
			try {
				const { csrfToken } = JSON.parse(resonseText)
				return csrfToken
			} catch (error) {
				console.error('Failed to parse CSRF token from response.', resonseText)
				return null
			}
		})
		.catch((e) => {
			console.log(e)
			throw e
		})
}
