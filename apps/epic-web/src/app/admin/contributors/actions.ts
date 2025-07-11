'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const IMPERSONATION_COOKIE_NAME = 'epicweb-impersonation'
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
	// Set a reasonable expiration (e.g., 4 hours)
	maxAge: 60 * 60 * 4,
}

export async function signInAs(formData: FormData) {
	const targetUserId = formData.get('userId') as string
	const adminId = formData.get('adminId') as string

	if (!targetUserId || !adminId) {
		throw new Error('Missing required data')
	}

	const cookieStore = await cookies()

	// Set impersonation cookie with both admin and target user IDs
	const impersonationData = {
		adminId,
		targetUserId,
		startedAt: new Date().toISOString(),
	}

	cookieStore.set(
		IMPERSONATION_COOKIE_NAME,
		JSON.stringify(impersonationData),
		COOKIE_OPTIONS,
	)

	// Clear any middleware cache
	revalidatePath('/', 'layout')

	// Redirect to dashboard
	redirect('/dashboard')
}

export async function stopImpersonating() {
	const cookieStore = await cookies()
	cookieStore.delete(IMPERSONATION_COOKIE_NAME)
	revalidatePath('/')
	redirect('/')
}

// Alias for consistency
export const stopImpersonation = stopImpersonating
