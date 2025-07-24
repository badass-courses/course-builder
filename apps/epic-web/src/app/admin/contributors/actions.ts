'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getImpersonatedSession } from '@/server/auth'
import { log } from '@/server/logger'

const IMPERSONATION_COOKIE_NAME = 'epicweb-impersonation'
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
	// Set a reasonable expiration (e.g., 4 hours)
	maxAge: 60 * 60 * 4,
}

/**
 * Validates that a string is a valid user ID format
 * Assumes IDs are non-empty strings with reasonable length constraints
 */
function isValidUserId(id: string): boolean {
	if (!id || typeof id !== 'string') return false

	// Basic validation: non-empty, reasonable length, no harmful characters
	const trimmed = id.trim()
	if (trimmed.length === 0 || trimmed.length > 100) return false

	// Check for basic SQL injection patterns and other harmful characters
	const dangerousPatterns = /['";<>{}\\]/
	if (dangerousPatterns.test(trimmed)) return false

	return true
}

/**
 * Validates authorization for impersonation by checking if the admin user has proper permissions
 */
async function validateAdminAuthorization(adminId: string): Promise<boolean> {
	try {
		const { session, ability } = await getImpersonatedSession()

		// Check if there's a valid session
		if (!session?.user?.id) {
			log.warn('Impersonation attempt without valid session', { adminId })
			return false
		}

		// Verify the adminId matches the current session user
		if (session.user.id !== adminId) {
			log.warn('Impersonation attempt with mismatched admin ID', {
				sessionUserId: session.user.id,
				providedAdminId: adminId,
			})
			return false
		}

		// Check if user has admin privileges
		if (ability.cannot('manage', 'all')) {
			log.warn('Impersonation attempt by non-admin user', {
				userId: session.user.id,
				userRole:
					session.user.roles?.map((r: any) => r.name).join(', ') ||
					session.user.role ||
					'user',
			})
			return false
		}

		return true
	} catch (error) {
		log.error('Error during admin authorization validation', {
			error: error instanceof Error ? error.message : 'Unknown error',
			adminId,
		})
		return false
	}
}

/**
 * Server action to initiate user impersonation with enhanced security validation
 */
export async function signInAs(formData: FormData) {
	const targetUserId = formData.get('userId') as string
	const adminId = formData.get('adminId') as string

	try {
		// Basic presence validation
		if (!targetUserId || !adminId) {
			log.warn('Impersonation attempt with missing required data', {
				hasTargetUserId: !!targetUserId,
				hasAdminId: !!adminId,
			})
			throw new Error('Missing required user identifiers')
		}

		// Validate ID formats
		if (!isValidUserId(targetUserId)) {
			log.warn('Impersonation attempt with invalid target user ID format', {
				targetUserId,
				adminId,
			})
			throw new Error('Invalid target user identifier format')
		}

		if (!isValidUserId(adminId)) {
			log.warn('Impersonation attempt with invalid admin ID format', {
				targetUserId,
				adminId,
			})
			throw new Error('Invalid admin identifier format')
		}

		// Prevent self-impersonation
		if (targetUserId === adminId) {
			log.warn('Impersonation attempt of self', {
				userId: adminId,
			})
			throw new Error('Cannot impersonate yourself')
		}

		// Validate admin authorization
		const isAuthorized = await validateAdminAuthorization(adminId)
		if (!isAuthorized) {
			log.error('Unauthorized impersonation attempt', {
				targetUserId,
				adminId,
			})
			throw new Error('Unauthorized: Insufficient privileges for impersonation')
		}

		// All validations passed, proceed with impersonation
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

		log.info('User impersonation initiated', {
			adminId,
			targetUserId,
			startedAt: impersonationData.startedAt,
		})

		// Clear any middleware cache
		revalidatePath('/', 'layout')

		// Redirect to dashboard
		redirect('/dashboard')
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error'

		log.error('Failed to initiate user impersonation', {
			error: errorMessage,
			targetUserId,
			adminId,
		})

		// Re-throw the error to be handled by the calling component
		throw error
	}
}

/**
 * Server action to stop user impersonation with proper logging
 */
export async function stopImpersonating() {
	try {
		const cookieStore = await cookies()

		// Log the impersonation termination
		log.info('User impersonation stopped', {
			timestamp: new Date().toISOString(),
		})

		cookieStore.delete(IMPERSONATION_COOKIE_NAME)
		revalidatePath('/')
		redirect('/')
	} catch (error) {
		log.error('Failed to stop user impersonation', {
			error: error instanceof Error ? error.message : 'Unknown error',
		})
		throw error
	}
}

// Alias for consistency
export const stopImpersonation = stopImpersonating
