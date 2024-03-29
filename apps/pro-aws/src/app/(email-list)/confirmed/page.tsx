import { Signature } from '@/app/(email-list)/_components/signature'
import { Layout } from '@/components/app/layout'

export default async function ConfirmedSubscriptionPage() {
	return (
		<Layout>
			<main className="flex flex-grow flex-col items-center justify-center px-5">
				<div className="max-w-lg text-center font-light">
					<h1 className="font-heading py-8 text-4xl font-bold lg:text-5xl">
						You&apos;re Confirmed!
					</h1>
					<p className="mx-auto pb-8 leading-relaxed sm:text-xl">
						Thanks for confirming your email address — you&apos;re all set to
						receive emails from me about Epic Web Dev.
					</p>
					<Signature />
				</div>
			</main>
		</Layout>
	)
}
