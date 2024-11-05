import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'
import { Mail } from 'lucide-react'

import * as LoginLink from '@coursebuilder/commerce-next/post-purchase/login-link'

const ThanksRedeem = async (props: {
	searchParams: Promise<{ purchaseId: string }>
}) => {
	const searchParams = await props.searchParams
	await headers()

	const purchase = await courseBuilderAdapter.getPurchaseWithUser(
		searchParams.purchaseId,
	)

	if (!purchase) {
		return notFound()
	}
	const user = await courseBuilderAdapter.getUser?.(purchase.userId as string)

	if (!user) {
		return notFound()
	}

	return (
		<div>
			<main className="flex flex-grow flex-col items-center justify-center px-5 pb-16 pt-5">
				<div className="mx-auto w-full max-w-3xl">
					<h1 className="font-heading w-full pb-3 text-3xl font-semibold sm:text-4xl">
						Success!
					</h1>
					<LoginLink.Root email={user.email} className="border-b pb-5">
						<LoginLink.Status />
						<LoginLink.Title />
						<LoginLink.CTA className="mt-4 inline-flex items-center gap-3">
							<div className="bg-primary/20 text-primary flex h-10 w-10 items-center justify-center rounded-full p-3">
								<Mail className="h-4 w-4" />
							</div>
							<span>
								Login link sent to:{' '}
								<strong className="font-semibold">{user.email}</strong>
							</span>
						</LoginLink.CTA>
						<LoginLink.Description className="text-sm opacity-75 sm:text-base" />
					</LoginLink.Root>
				</div>
			</main>
		</div>
	)
}

export default ThanksRedeem
