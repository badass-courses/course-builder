import { Suspense } from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getCsrf } from '@/app/(user)/login/actions'
import { Login } from '@/components/login'
import Spinner from '@/components/spinner'
import { db } from '@/db'
import { invites } from '@/db/schema'
import { getProviders, Provider } from '@/server/auth'
import { eq } from 'drizzle-orm'
import { CheckCircle } from 'lucide-react'

type Params = Promise<{ inviteId: string }>

// Create a separate component for the status check
async function InviteStatus({
	inviteId,
	providers,
	csrfToken,
}: {
	inviteId: string
	providers: Record<string, Provider> | null
	csrfToken: string
}) {
	// Force dynamic behavior
	headers()

	const invite = await db.query.invites.findFirst({
		where: eq(invites.id, inviteId),
		columns: {
			acceptedEmail: true,
			inviteState: true,
		},
	})

	if (!invite) {
		notFound()
	}

	if (invite.inviteState === 'VERIFIED') {
		return (
			<div className="flex items-center justify-center gap-4">
				<Spinner />
				<p className="text-muted-foreground text-sm font-medium">
					Your instructor profile is being created. Please refresh the page in a
					few seconds.
				</p>
			</div>
		)
	}

	return (
		<>
			<div className="flex justify-center gap-4">
				<CheckCircle className="h-10 w-10 text-green-500" />
				<p className="text-muted-foreground text-sm font-medium">
					Your instructor profile has been created successfully. Please sign in
					below to begin uploading your lessons.
				</p>
			</div>
			<Login csrfToken={csrfToken} providers={providers} />
		</>
	)
}

export default async function OnboardingCompletedPage(props: {
	params: Params
}) {
	const { inviteId } = await props.params
	const providers = await getProviders()
	const csrfToken = await getCsrf()

	return (
		<div className="container mx-auto max-w-2xl py-16">
			<Suspense
				fallback={
					<div className="flex items-center justify-center gap-4">
						<Spinner />
						<p className="text-muted-foreground text-sm font-medium">
							Checking status...
						</p>
					</div>
				}
			>
				<InviteStatus
					inviteId={inviteId}
					providers={providers}
					csrfToken={csrfToken}
				/>
			</Suspense>
		</div>
	)
}
