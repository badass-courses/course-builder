import { redirect } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'
import { InvoiceCard } from '@/path-to-purchase/invoice-card'
import { getServerAuthSession } from '@/server/auth'

import { Purchase } from '@coursebuilder/core/schemas'

const Invoices = async () => {
	const { ability, session } = await getServerAuthSession()
	const { getPurchasesForUser } = courseBuilderAdapter
	if (ability.can('view', 'Invoice')) {
		redirect('/login')
	}

	const purchases = await getPurchasesForUser(session?.user?.id)
	return (
		<div>
			<main className="mx-auto flex h-full w-full max-w-2xl flex-grow flex-col px-5 py-24 sm:py-32">
				<h1 className="font-heading pb-4 text-3xl font-black">Your Invoices</h1>
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
