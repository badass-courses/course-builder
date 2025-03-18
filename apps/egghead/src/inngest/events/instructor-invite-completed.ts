export const INSTRUCTOR_INVITE_COMPLETED_EVENT = 'instructor/invite/completed'
export type InstructorInviteCompleted = {
	name: typeof INSTRUCTOR_INVITE_COMPLETED_EVENT
	data: {
		inviteId: string
		firstName: string
		lastName: string
		email: string
		twitter?: string
		website?: string
		bio?: string
		bluesky?: string
		profileImageUrl?: string
	}
}
