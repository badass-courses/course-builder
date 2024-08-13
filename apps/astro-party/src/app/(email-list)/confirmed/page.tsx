import { Layout } from '@/components/layout'
import config from '@/config'

export default async function ConfirmedSubscriptionPage() {
	return (
		<Layout className="bg-brand-green container flex min-h-screen flex-col-reverse items-center justify-center border-x-0 px-3 sm:px-5 lg:flex-row">
			<div className="max-w-lg text-center font-light">
				<h1 className="font-heading py-8 text-4xl font-bold lg:text-5xl">
					You&apos;re Confirmed!
				</h1>
				<p className="mx-auto pb-8 leading-relaxed sm:text-xl">
					Thanks for confirming your email address — you&apos;re all set to
					receive emails from me about {config.defaultTitle}.
				</p>
				{/* <Signature /> */}
			</div>
		</Layout>
	)
}
