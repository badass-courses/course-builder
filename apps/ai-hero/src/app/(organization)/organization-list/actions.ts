'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { z } from 'zod'

// Validation schema for organization ID
const organizationIdSchema = z
	.string()
	.min(1, 'Organization ID cannot be empty')
	.regex(/^[a-zA-Z0-9_-]+$/, 'Invalid organization ID format')

/**
 * Switch the current user to a different organization
 * @param organizationId - The ID of the organization to switch to
 * @throws {Error} - When validation fails, user is unauthorized, or operation fails
 */
export async function switchOrganization(organizationId: string) {
	try {
		// 1. Validate input
		const validationResult = organizationIdSchema.safeParse(organizationId)
		if (!validationResult.success) {
			const errorMessage =
				validationResult.error.errors[0]?.message || 'Invalid organization ID'
			await log.warn('switch-organization-validation-failed', {
				organizationId,
				error: errorMessage,
			})
			throw new Error(errorMessage)
		}

		const validatedOrgId = validationResult.data

		// 2. Get current user session
		const { session } = await getServerAuthSession()
		if (!session?.user?.id) {
			await log.warn('switch-organization-unauthorized', {
				organizationId: validatedOrgId,
				reason: 'No session or user ID',
			})
			throw new Error('Authentication required')
		}

		const userId = session.user.id

		// 3. Verify user has access to the specified organization
		const userMemberships =
			await courseBuilderAdapter.getMembershipsForUser(userId)
		const hasAccess = userMemberships.some(
			(membership) => membership.organizationId === validatedOrgId,
		)

		if (!hasAccess) {
			await log.warn('switch-organization-access-denied', {
				userId,
				organizationId: validatedOrgId,
				userMemberships: userMemberships.map((m) => m.organizationId),
			})
			throw new Error(
				'Access denied: You are not a member of this organization',
			)
		}

		// 4. Set the organization cookie with error handling
		try {
			const cookieStore = await cookies()
			cookieStore.set('organizationId', validatedOrgId)

			await log.info('switch-organization-success', {
				userId,
				organizationId: validatedOrgId,
			})
		} catch (cookieError) {
			await log.error('switch-organization-cookie-failed', {
				userId,
				organizationId: validatedOrgId,
				error:
					cookieError instanceof Error
						? cookieError.message
						: 'Unknown cookie error',
			})
			throw new Error('Failed to set organization preference')
		}

		// 5. Redirect with error handling
		try {
			redirect('/organization-list')
		} catch (redirectError) {
			// Note: redirect() throws a NEXT_REDIRECT error by design, so we only log actual errors
			if (
				redirectError instanceof Error &&
				!redirectError.message.includes('NEXT_REDIRECT')
			) {
				await log.error('switch-organization-redirect-failed', {
					userId,
					organizationId: validatedOrgId,
					error: redirectError.message,
				})
				throw new Error('Failed to redirect after organization switch')
			}
			// Re-throw the redirect as it's expected behavior
			throw redirectError
		}
	} catch (error) {
		// Log the error for observability
		await log.error('switch-organization-failed', {
			organizationId,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})

		// Re-throw the error to be handled by the calling code
		throw error
	}
}
