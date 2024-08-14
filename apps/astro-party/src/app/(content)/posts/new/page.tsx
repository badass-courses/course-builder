import * as React from 'react'
import { Layout } from '@/components/layout'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'

export const dynamic = 'force-dynamic'

export default async function NewArticlePage() {
	return (
		<Layout>
			<CreateResourcePage resourceType="post" />
		</Layout>
	)
}
