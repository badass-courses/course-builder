import { notFound } from 'next/navigation'
import { db } from '@/db'
import { invites } from '@/db/schema'
import { eq } from 'drizzle-orm'

import { AcceptInviteForm } from './_components/accept-invite-form'

interface InvitePageProps {
	params: {
		inviteId: string
	}
}

export default async function InvitePage({ params }: InvitePageProps) {
	const invite = await db.query.invites.findFirst({
		where: eq(invites.id, params.inviteId),
		columns: {
			inviteEmail: true,
			inviteState: true,
		},
	})

	console.log('invite', params.inviteId, invite)

	if (!invite || invite.inviteState !== 'INITIATED') {
		notFound()
	}

	return (
		<div className="container mx-auto max-w-2xl py-16">
			<h1 className="mb-8 text-3xl font-bold">Accept Instructor Invitation</h1>
			<AcceptInviteForm
				inviteId={params.inviteId}
				inviteEmail={invite.inviteEmail}
			/>
		</div>
	)
}
