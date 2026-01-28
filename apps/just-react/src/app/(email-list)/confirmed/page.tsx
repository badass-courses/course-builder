import { Signature } from '@/app/(email-list)/_components/signature'
import LayoutClient from '@/components/layout-client'

import { SetSubscriberCookie } from './set-subscriber-cookie'

type ConfirmedPageProps = {
	searchParams: Promise<{ email?: string }>
}

/**
 * Confirmation page shown after successful newsletter subscription.
 * Sets a cookie to remember the subscriber for showing subscribed state.
 */
export default async function ConfirmedSubscriptionPage({
	searchParams,
}: ConfirmedPageProps) {
	const { email } = await searchParams

	return (
		<LayoutClient withContainer>
			{/* Set subscriber cookie via client component */}
			{email && <SetSubscriberCookie email={email} />}
			<main className="min-h-fullscreen flex grow flex-col items-center justify-center">
				<div className="max-w-lg text-center font-light">
					<h1 className="font-heading pb-5 text-4xl font-bold lg:text-5xl">
						You&apos;re Subscribed
					</h1>
					<p className="mx-auto text-balance pb-8 font-serif leading-relaxed sm:text-lg">
						Thanks for confirming your email address - you&apos;re all set to
						receive emails from me.
					</p>
					<Signature />
				</div>
			</main>
		</LayoutClient>
	)
}
