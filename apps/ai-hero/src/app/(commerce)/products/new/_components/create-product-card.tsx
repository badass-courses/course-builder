'use client'

import { CreateProductForm } from '@/app/(commerce)/products/new/_components/create-product-form'
import { type NewProduct } from '@/lib/products'

import { Product } from '@coursebuilder/core/schemas'
import { Card, CardContent, CardHeader } from '@coursebuilder/ui'

export function CreateProductCard({
	onCreate,
	createProduct,
}: {
	onCreate: (product: Product) => Promise<void>
	createProduct: (values: NewProduct) => Promise<Product | null>
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
			<CardContent>
				<CreateProductForm onCreate={onCreate} createProduct={createProduct} />
			</CardContent>
		</Card>
	)
}
