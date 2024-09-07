import * as React from 'react'
import Link from 'next/link.js'
import { DocumentTextIcon } from '@heroicons/react/24/solid'
import { format } from 'date-fns'
import { ChevronRightIcon } from 'lucide-react'

import { Purchase } from '@coursebuilder/core/schemas'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export const InvoiceCard: React.FC<{
	purchase: Purchase | any
	className?: string
	children?: React.ReactNode
}> = ({ className, purchase, children }) => {
	const invoiceRoutePath = `/invoices/${purchase.merchantChargeId}`

	return (
		<Card className={cn('', className)}>
			<CardHeader>
				<CardTitle>
					<Link href={invoiceRoutePath}>Invoice: {purchase.product.name}</Link>
				</CardTitle>
				<CardDescription>
					<span className="after:content-['・']">
						{Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD',
						}).format(purchase.totalAmount)}
					</span>
					<span>{format(new Date(purchase.createdAt), 'MMMM d, y')}</span>
				</CardDescription>
			</CardHeader>
			{children && <CardContent>{children}</CardContent>}
			<CardFooter>
				<Button variant="outline" asChild size="sm">
					<Link href={invoiceRoutePath}>View</Link>
				</Button>
			</CardFooter>
		</Card>
	)
}
