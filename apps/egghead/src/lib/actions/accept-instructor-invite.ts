'use server'

import { revalidatePath } from 'next/cache'
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

	if (invite.inviteEmail !== email) {
		throw new Error('Email does not match invite')
	}

	await db
		.update(invites)
		.set({
			inviteState: 'VERIFIED',
		})
		.where(eq(invites.id, inviteId))

	revalidatePath(`/invites/${inviteId}`)
}
