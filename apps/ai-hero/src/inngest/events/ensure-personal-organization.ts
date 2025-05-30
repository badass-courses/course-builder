export const ENSURE_PERSONAL_ORGANIZATION_EVENT = 'organization/ensure-personal'

export type EnsurePersonalOrganization = {
	name: typeof ENSURE_PERSONAL_ORGANIZATION_EVENT
	data: {
		userId: string
		createIfMissing?: boolean
	}
}
