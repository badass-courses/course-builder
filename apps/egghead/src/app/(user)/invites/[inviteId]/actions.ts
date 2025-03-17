'use server'

import { redirect } from 'next/navigation'
import { db } from '@/db'
import { invites } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface AcceptInstructorInviteParams {
	inviteId: string
	email: string
}

export async function acceptInstructorInvite({
	inviteId,
	email,
}: AcceptInstructorInviteParams) {
	const invite = await db.query.invites.findFirst({
		where: eq(invites.id, inviteId),
		columns: {
			inviteEmail: true,
			inviteState: true,
		},
	})

	if (!invite) {
		throw new Error('Invite not found')
	}

	if (invite.inviteState !== 'INITIATED') {
		throw new Error('Invite has already been used or expired')
	}

	await db
		.update(invites)
		.set({
			inviteState: 'VERIFIED',
			acceptedEmail: email,
			confirmedAt: new Date(),
		})
		.where(eq(invites.id, inviteId))

	redirect(`/invites/${inviteId}/onboarding`)
}
