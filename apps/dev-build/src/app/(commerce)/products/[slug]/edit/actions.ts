'use server'

import { redirect } from 'next/navigation'

export const onProductSave = async (resource: {
	fields: Record<string, any> | null
}) => {
	'use server'
	redirect(`/products/${resource.fields?.slug}`)
}
