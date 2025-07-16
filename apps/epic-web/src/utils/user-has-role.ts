import type { User } from '@/ability'

/**
 * Check if a user has a specific role
 *
 * This function provides backward compatibility during the transition from user.role
 * to user.roles array. It checks the roles array first, then falls back to the
 * legacy role property if the array is not available.
 *
 * @param user - The user object to check
 * @param roleName - The name of the role to check for
 * @returns True if the user has the specified role, false otherwise
 *
 * @example
 * ```ts
 * const isAdmin = userHasRole(user, 'admin')
 * const isContributor = userHasRole(user, 'contributor')
 * ```
 */
export function userHasRole(
	user: User | undefined | null,
	roleName: string,
): boolean {
	if (!user) return false

	// Check the new roles array first (preferred)
	if (user.roles && Array.isArray(user.roles)) {
		return user.roles.some((role) => role.name === roleName)
	}

	// Fall back to the legacy role property for backward compatibility
	if (user.role) {
		return user.role === roleName
	}

	return false
}
