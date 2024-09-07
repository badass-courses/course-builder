import { Layout } from '@/components/layout'
import config from '@/config'

export default async function ConfirmedSubscriptionPage() {
	return (
		<Layout withBackground={false} withBorder={false}>
			<div className="mx-auto max-w-lg py-24 text-center font-light">
				<h1 className="font-heading py-8 text-4xl font-bold lg:text-5xl">
					You&apos;re Confirmed!
				</h1>
				<p className="font-rounded mx-auto pb-8 font-medium leading-relaxed sm:text-xl">
					Thanks for confirming your email address — you&apos;re all set to
					receive emails from me about {config.defaultTitle}.
				</p>
				{/* <Signature /> */}
			</div>
		</Layout>
	)
}
