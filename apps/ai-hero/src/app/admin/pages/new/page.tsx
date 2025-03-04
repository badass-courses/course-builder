import * as React from 'react'
import LayoutClient from '@/components/layout-client'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'

export const dynamic = 'force-dynamic'

export default async function NewPagePage() {
	return <CreateResourcePage resourceType="page" pathPrefix="/admin" />
}
