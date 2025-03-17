import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getCsrf } from '@/app/(user)/login/actions'
import { Login } from '@/components/login'
import { db } from '@/db'
import { invites } from '@/db/schema'
import { getProviders } from '@/server/auth'
import { eq } from 'drizzle-orm'
import { CheckCircle } from 'lucide-react'

interface OnboardingPageProps {
	params: {
		inviteId: string
	}
}

export default async function OnboardingCompletedPage({
	params,
}: OnboardingPageProps) {
	await headers()
	const { inviteId } = await params

	const providers = getProviders()
	const csrfToken = await getCsrf()

	const invite = await db.query.invites.findFirst({
		where: eq(invites.id, inviteId),
		columns: {
			acceptedEmail: true,
			inviteState: true,
		},
	})

	if (!invite || invite.inviteState !== 'COMPLETED') {
		notFound()
	}

	return (
		<div className="container mx-auto max-w-2xl py-16">
			<div className="flex justify-center gap-4">
				<CheckCircle className="h-10 w-10 text-green-500" />
				<p className="text-muted-foreground text-sm font-medium">
					Your instructor profile has been created successfully. Please sign in
					below to begin uploading your lessons.
				</p>
			</div>
			<Login csrfToken={csrfToken} providers={providers} />
		</div>
	)
}
