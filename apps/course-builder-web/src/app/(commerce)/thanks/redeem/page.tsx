import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'
import { LoginLink } from '@/path-to-purchase/post-purchase-login-link'

const ThanksRedeem = async ({
	searchParams,
}: {
	searchParams: { purchaseId: string }
}) => {
	headers()

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
					<h1 className="w-full pb-3 font-semibold uppercase tracking-wide">
						Success!
					</h1>
					<LoginLink email={user.email} />
				</div>
			</main>
		</div>
	)
}

export default ThanksRedeem
