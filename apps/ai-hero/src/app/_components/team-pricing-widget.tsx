'use client'

import Link from 'next/link'

import { Button } from '@coursebuilder/ui'

export const TeamPricingWidget = () => {
	return (
		<div className="flex flex-col items-center">
			<div className="mt-3 px-5 text-center text-xl font-bold sm:text-2xl">
				Level up Your Team
			</div>
			<div className="mt-2 flex h-[76px] items-center justify-center gap-0.5">
				<div className="text-foreground font-heading text-6xl font-bold">
					Teams
				</div>
			</div>
			<div className="text-muted-foreground mt-3 text-center text-base">
				Get custom pricing, dedicated support, and enterprise features tailored
				to your organization's needs.
			</div>
			<Link
				href="/for-your-team"
				className="bg-primary text-primary-foreground mt-6 flex h-14 w-full max-w-md items-center justify-center rounded px-4 py-4 text-center text-base font-medium ring-offset-1 transition ease-in-out disabled:cursor-wait"
			>
				Contact Sales
			</Link>
		</div>
	)
}
