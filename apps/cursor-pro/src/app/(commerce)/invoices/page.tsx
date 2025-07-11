import LayoutClient from '@/components/layout-client'
import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'

import { InvoiceCard } from '@coursebuilder/commerce-next/invoices/invoice-card'
import { Purchase } from '@coursebuilder/core/schemas'

const Invoices = async () => {
	const { session } = await getServerAuthSession()

	const purchases =
		(await courseBuilderAdapter.getPurchasesForUser(session?.user?.id)) || []
	return (
		<LayoutClient withContainer>
			<main className="flex min-h-[calc(100vh-var(--nav-height))] flex-col">
				<div className="max-w-(--breakpoint-md) mx-auto flex h-full w-full flex-grow flex-col items-center py-16">
					<h1 className="font-heading mb-16 text-3xl font-bold">
						{purchases.length > 0 ? 'Your Invoices' : 'No invoices'}
					</h1>
					<ul className="flex w-full flex-col">
						{purchases
							.filter((purchase: Purchase) => purchase.merchantChargeId)
							.map((purchase: Purchase | any) => {
								return (
									<li key={purchase.merchantChargeId}>
										<InvoiceCard
											className="rounded-none border-0 shadow-none"
											purchase={purchase}
										/>
									</li>
								)
							})}
					</ul>
				</div>
			</main>
		</LayoutClient>
	)
}

export default Invoices
