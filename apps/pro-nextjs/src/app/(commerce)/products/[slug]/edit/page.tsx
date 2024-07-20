import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { EditProductForm } from '@/app/(commerce)/products/[slug]/edit/_components/edit-product-form'
import { getProduct } from '@/lib/products-query'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function PromptEditPage({
	params,
}: {
	params: { slug: string }
}) {
	headers()
	const { ability } = await getServerAuthSession()
	const product = await getProduct(params.slug)

	if (!product || !ability.can('create', 'Content')) {
		notFound()
	}

	console.log({ product })

	return <EditProductForm key={product.fields?.slug} product={product} />
}
