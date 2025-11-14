import LayoutClient from '@/components/layout-client'
import { getServerAuthSession } from '@/server/auth'

import ContactForm from './form'

export default async function ContactPage() {
	const { session } = await getServerAuthSession()

	return (
		<LayoutClient withContainer>
			<div className="min-h-[calc(100vh-var(--nav-height))] py-10 md:py-16">
				<div className="mx-auto max-w-4xl">
					<h1 className="text-center text-2xl font-bold sm:text-4xl">
						Contact
					</h1>
					<div className="bg-muted ring-border mx-auto mt-6 w-full max-w-xl rounded-xl p-3 ring-1 sm:mt-10">
						<ContactForm user={session?.user} />
					</div>
				</div>
			</div>
		</LayoutClient>
	)
}
