import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
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
		<LayoutClient withContainer>
			<main className="container min-h-[calc(100vh-var(--nav-height))] border-x px-5 py-8 sm:py-16">
				<div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-5 text-center">
					<h1 className="w-full text-balance text-2xl font-semibold sm:text-3xl">
						Success! Please check your inbox for a login link.
					</h1>
					<LoginLink.Root
						email={user.email}
						className="flex flex-col items-center text-center"
					>
						<LoginLink.CTA className="my-4 flex w-full items-center justify-center gap-3 text-center">
							<div className="bg-primary/20 text-primary flex h-10 w-10 items-center justify-center rounded-full p-3">
								<Mail className="h-4 w-4" />
							</div>
							<span className="font-semibold">
								Login link sent to: {user.email}
							</span>
						</LoginLink.CTA>
						<LoginLink.Description className="pt-5 text-sm" />
					</LoginLink.Root>
				</div>
			</main>
		</LayoutClient>
	)
}

export default ThanksRedeem
