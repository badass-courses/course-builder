import { Signature } from '@/app/(email-list)/_components/signature'
import LayoutClient from '@/components/layout-client'
import config from '@/config'

export default async function ConfirmedSubscriptionPage() {
	return (
		<LayoutClient withContainer>
			<main className="min-h-(--pane-layout-height) flex grow flex-col items-center justify-center">
				<div className="max-w-lg text-center font-light">
					<h1 className="font-heading py-8 text-4xl font-bold lg:text-5xl">
						You&apos;re Confirmed!
					</h1>
					<p className="mx-auto pb-8 leading-relaxed sm:text-xl">
						Thanks for confirming your email address — you&apos;re all set to
						receive emails from me about {config.defaultTitle}.
					</p>
					<Signature />
				</div>
			</main>
		</LayoutClient>
	)
}
