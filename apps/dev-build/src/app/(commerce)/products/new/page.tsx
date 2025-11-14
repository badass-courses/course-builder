import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { CreateProductCard } from '@/app/(commerce)/products/new/_components/create-product-card'
import { createProduct } from '@/lib/products-query'
import { getServerAuthSession } from '@/server/auth'

import { Product } from '@coursebuilder/core/schemas'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div className="flex flex-col">
			<CreateProductCard
				onCreate={async (product: Product) => {
					'use server'
					redirect(`/products/${product.fields?.slug}/edit`)
				}}
				createProduct={createProduct}
			/>
		</div>
	)
}
