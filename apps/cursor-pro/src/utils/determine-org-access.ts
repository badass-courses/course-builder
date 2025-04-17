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
	const { ownerRole, hasValidCurrentOrgRole } = roles.reduce(
		(acc, role) => {
			if (!role.active) return acc
			if (role.name === 'owner') acc.ownerRole = role
			if (currentOrgId && role.organizationId === currentOrgId)
				acc.hasValidCurrentOrgRole = true
			return acc
		},
		{
			ownerRole: null as OrganizationRole | null,
			hasValidCurrentOrgRole: false,
		},
	)

	if (!hasValidCurrentOrgRole && !ownerRole) {
		return { action: 'REDIRECT_TO_ORG_LIST' }
	}

	if (!hasValidCurrentOrgRole && ownerRole) {
		return {
			action: 'SET_OWNER_ORG',
			organizationId: ownerRole.organizationId,
		}
	}

	return {
		action: 'USE_CURRENT_ORG',
		organizationId: currentOrgId,
	}
}
