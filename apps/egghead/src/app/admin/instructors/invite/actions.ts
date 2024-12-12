'use server'

import { INSTRUCTOR_INVITE_CREATED_EVENT } from '@/inngest/events/instructor-invite-created'
import { inngest } from '@/inngest/inngest.server'

export async function inviteInstructor(email: string) {
	await inngest.send({
		name: INSTRUCTOR_INVITE_CREATED_EVENT,
		data: { email },
	})
}
