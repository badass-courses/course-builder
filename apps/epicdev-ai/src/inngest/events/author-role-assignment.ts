export const AUTHOR_ROLE_ASSIGNMENT_STARTED_EVENT =
	'author/role-assignment-started'
export const AUTHOR_ROLE_ASSIGNMENT_COMPLETED_EVENT =
	'author/role-assignment-completed'
export const AUTHOR_ROLE_ASSIGNMENT_FAILED_EVENT =
	'author/role-assignment-failed'

export type AuthorRoleAssignmentStarted = {
	name: typeof AUTHOR_ROLE_ASSIGNMENT_STARTED_EVENT
	data: {
		email: string
		name?: string
		timestamp: string
	}
}

export type AuthorRoleAssignmentCompleted = {
	name: typeof AUTHOR_ROLE_ASSIGNMENT_COMPLETED_EVENT
	data: {
		userId: string
		email: string
		name?: string
		wasCreated: boolean
		timestamp: string
	}
}

export type AuthorRoleAssignmentFailed = {
	name: typeof AUTHOR_ROLE_ASSIGNMENT_FAILED_EVENT
	data: {
		email: string
		name?: string
		error: string
		timestamp: string
	}
}
