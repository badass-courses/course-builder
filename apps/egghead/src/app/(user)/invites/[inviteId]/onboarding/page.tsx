import { notFound } from 'next/navigation'
import { db } from '@/db'
import { invites } from '@/db/schema'
import { eq } from 'drizzle-orm'

import { InstructorOnboardingForm } from './_components/instructor-onboarding-form'

type Params = Promise<{ inviteId: string }>

export default async function OnboardingPage(props: { params: Params }) {
	const { inviteId } = await props.params
	const invite = await db.query.invites.findFirst({
		where: eq(invites.id, inviteId),
		columns: {
			acceptedEmail: true,
			inviteState: true,
		},
	})

	if (!invite || invite.inviteState !== 'VERIFIED') {
		notFound()
	}

	return (
		<div className="container mx-auto max-w-2xl py-16">
			<h1 className="mb-8 text-3xl font-bold">Create an Instructor Profile</h1>
			<InstructorOnboardingForm
				inviteId={inviteId}
				acceptedEmail={invite.acceptedEmail!}
			/>
		</div>
	)
}
