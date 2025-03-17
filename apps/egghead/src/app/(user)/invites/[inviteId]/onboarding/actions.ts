'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { accounts, invites, profiles, users } from '@/db/schema'
import { INSTRUCTOR_INVITE_COMPLETED_EVENT } from '@/inngest/events/instructor-invite-completed'
import { inngest } from '@/inngest/inngest.server'
import { addRoleToUser } from '@/lib/users'
import { eq } from 'drizzle-orm'

interface CreateInstructorProfileParams {
	inviteId: string
	firstName: string
	lastName: string
	email: string
	twitter?: string
	website?: string
	bio?: string
	bluesky?: string
}

export async function createInstructorProfile({
	inviteId,
	firstName,
	lastName,
	email,
	twitter,
	website,
	bluesky,
	bio,
}: CreateInstructorProfileParams) {
	await inngest.send({
		name: INSTRUCTOR_INVITE_COMPLETED_EVENT,
		data: {
			inviteId,
			firstName,
			lastName,
			email,
			twitter,
			website,
			bio,
			bluesky,
		},
	})

	redirect(`/invites/${inviteId}/onboarding/completed`)
}
