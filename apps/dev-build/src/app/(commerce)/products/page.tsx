import * as React from 'react'
import Link from 'next/link'
import { getProducts } from '@/lib/products-query'
import { getServerAuthSession } from '@/server/auth'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function EventIndexPage() {
	const { ability } = await getServerAuthSession()
	const products = await getProducts()

	return (
		<div>
			{ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild className="h-7">
						<Link href={`/products/new`}>New Product</Link>
					</Button>
				</div>
			) : null}
			<div className="flex flex-col space-y-4 p-5 sm:p-10">
				<h2 className="text-lg font-bold">Products</h2>
				{products.map((product) => (
					<Card key={product.id}>
						<CardHeader>
							<CardTitle>
								<Link href={`/products/${product.fields?.slug || product.id}`}>
									{product.name}
								</Link>
							</CardTitle>
						</CardHeader>
						<CardContent></CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
