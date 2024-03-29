import { Metadata } from 'next/types'
import { Signature } from '@/app/(email-list)/_components/signature'
import { Layout } from '@/components/app/layout'

export const metadata: Metadata = {
	title: 'Confirm your subscription',
}

export default async function ConfirmSubscriptionPage() {
	return (
		<Layout>
			<main className="flex flex-grow flex-col items-center justify-center px-5 py-24">
				<div className="flex max-w-xl flex-col items-center justify-center text-center font-light">
					<h1 className="font-text mx-auto w-full max-w-lg py-8 text-3xl font-bold sm:text-4xl">
						Please check your inbox for an email that just got sent.
					</h1>
					<p className="mx-auto pb-8 leading-relaxed sm:text-lg">
						You&apos;ll need to click the confirmation link to receive any
						further emails. If you don&apos;t see the email after a few minutes,
						you might check your spam folder or other filters and add{' '}
						<strong>hello@kentcdodds.com</strong> to your contacts.
					</p>
					<p className="sm:text-lg">
						Thanks, <br />
						<Signature />
					</p>
				</div>
			</main>
		</Layout>
	)
}
