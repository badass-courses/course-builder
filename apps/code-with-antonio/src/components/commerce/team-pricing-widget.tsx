'use client'

import Link from 'next/link'

import { Button } from '@coursebuilder/ui'

export const TeamPricingWidget = () => {
	return (
		<div className="flex flex-col items-center">
			<div className="mt-3 px-5 text-center text-xl font-bold sm:text-2xl">
				Level up Your Team
			</div>
			{/* <div className="mt-2 flex h-[76px] items-center justify-center gap-0.5">
				<div className="font-heading text-xl text-center font-bold">
					Membership For Teams
				</div>
			</div> */}
			<div className="text-muted-foreground mt-2 text-balance text-center text-base">
				Get custom pricing, dedicated support, and enterprise features tailored
				to your organization's needs.
			</div>
			<Button
				asChild
				variant="outline"
				className="mt-5 h-14 w-full rounded-lg"
				size="lg"
			>
				<Link href="/for-your-team">Contact Sales</Link>
			</Button>
		</div>
	)
}
