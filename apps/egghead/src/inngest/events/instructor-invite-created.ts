export const INSTRUCTOR_INVITE_CREATED_EVENT = 'instructor/invite/created'
export type InstructorInviteCreated = {
	name: typeof INSTRUCTOR_INVITE_CREATED_EVENT
	data: {
		email: string
		invitedById: string
	}
}
