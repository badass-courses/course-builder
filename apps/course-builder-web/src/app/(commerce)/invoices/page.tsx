import { redirect } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'

import { InvoiceCard } from '@coursebuilder/commerce-next/path-to-purchase/invoice-card'
import { Purchase } from '@coursebuilder/core/schemas'

const Invoices = async () => {
	const { session } = await getServerAuthSession()

	const purchases =
		(await courseBuilderAdapter.getPurchasesForUser(session?.user?.id)) || []
	return (
		<div>
			<main className="mx-auto flex h-full w-full max-w-2xl flex-grow flex-col px-5 py-24 sm:py-32">
				<h1 className="font-heading pb-4 text-3xl font-black">
					{purchases.length > 0 ? 'Your Invoices' : 'No invoices'}
				</h1>
				<ul className="flex flex-col gap-2">
					{purchases
						.filter((purchase: Purchase) => purchase.merchantChargeId)
						.map((purchase: Purchase | any) => {
							return (
								<li key={purchase.merchantChargeId}>
									<InvoiceCard purchase={purchase} />
								</li>
							)
						})}
				</ul>
			</main>
		</div>
	)
}

export default Invoices
