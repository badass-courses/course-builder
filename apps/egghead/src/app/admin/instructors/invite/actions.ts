'use server'

import { INSTRUCTOR_INVITE_CREATED_EVENT } from '@/inngest/events/instructor-invite-created'
import { inngest } from '@/inngest/inngest.server'
import { getServerAuthSession } from '@/server/auth'

export async function inviteInstructor(email: string) {
	const { session } = await getServerAuthSession()

	if (!session?.user?.id) return

	await inngest.send({
		name: INSTRUCTOR_INVITE_CREATED_EVENT,
		data: {
			email,
			invitedById: session.user.id,
		},
	})
}
