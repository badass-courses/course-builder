export type OrgAuthResult = {
	action: 'REDIRECT_TO_ORG_LIST' | 'SET_OWNER_ORG' | 'USE_CURRENT_ORG'
	organizationId?: string
}

export type OrganizationRole = {
	active: boolean
	name: string
	organizationId: string
}

export type AuthUser = {
	organizationRoles: OrganizationRole[]
}

export function determineOrgAccess(
	roles: OrganizationRole[],
	currentOrgId?: string,
): OrgAuthResult {
	const { learnerRole, ownerRole, hasValidCurrentOrgRole } = roles.reduce(
		(acc, role) => {
			if (!role.active) return acc
			if (role.name === 'learner' && !acc.learnerRole) acc.learnerRole = role
			if (role.name === 'owner' && !acc.ownerRole) acc.ownerRole = role
			if (currentOrgId && role.organizationId === currentOrgId)
				acc.hasValidCurrentOrgRole = true
			return acc
		},
		{
			learnerRole: null as OrganizationRole | null,
			ownerRole: null as OrganizationRole | null,
			hasValidCurrentOrgRole: false,
		},
	)

	if (!hasValidCurrentOrgRole && !learnerRole && !ownerRole) {
		return { action: 'REDIRECT_TO_ORG_LIST' }
	}

	if (!hasValidCurrentOrgRole) {
		// Prioritize learner role first, then fall back to owner role
		const defaultRole = learnerRole || ownerRole
		if (defaultRole) {
			return {
				action: 'SET_OWNER_ORG',
				organizationId: defaultRole.organizationId,
			}
		}
	}

	return {
		action: 'USE_CURRENT_ORG',
		organizationId: currentOrgId,
	}
}
