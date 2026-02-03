import * as React from 'react'
import Link from 'next/link'
import LayoutClient from '@/components/layout-client'
import { getProducts } from '@/lib/products-query'
import { getServerAuthSession } from '@/server/auth'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function ProductsPage() {
	const { ability } = await getServerAuthSession()
	const products = await getProducts()

	return (
		<LayoutClient withContainer>
			{ability.can('update', 'Content') ? (
				<div className="flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild className="h-7">
						<Link href={`/admin/products/new`}>New Product</Link>
					</Button>
				</div>
			) : null}
			<div className="flex flex-col space-y-4">
				<h2 className="text-lg font-semibold">Products</h2>
				{products.map((product) => (
					<Card key={product.id}>
						<CardHeader>
							<CardTitle>
								<Link
									href={`/admin/products/${product.fields?.slug || product.id}/edit`}
								>
									{product.name}
								</Link>
							</CardTitle>
						</CardHeader>
						<CardContent>
							{ability.can('update', 'Content') ? (
								<Button variant="outline" size="sm" asChild>
									<Link
										href={`/admin/products/${product.fields?.slug || product.id}/edit`}
									>
										Edit
									</Link>
								</Button>
							) : null}
						</CardContent>
					</Card>
				))}
			</div>
		</LayoutClient>
	)
}
