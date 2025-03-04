import * as React from 'react'
import LayoutClient from '@/components/layout-client'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'

export const dynamic = 'force-dynamic'

export default async function NewPromptPage() {
	return (
		<LayoutClient withContainer>
			<CreateResourcePage resourceType="prompt" />
		</LayoutClient>
	)
}
