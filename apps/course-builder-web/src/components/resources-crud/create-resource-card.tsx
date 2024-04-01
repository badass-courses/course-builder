'use client'

import { CreateResourceForm } from '@/components/resources-crud/create-resource-form'

import { ContentResource } from '@coursebuilder/core/types'
import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

export function CreateResourceCard({
	resourceType,
	onCreate,
}: {
	resourceType: string
	onCreate: (resource: ContentResource) => Promise<void>
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
			<CardContent>
				<CreateResourceForm resourceType={resourceType} onCreate={onCreate} />
			</CardContent>
			<CardFooter></CardFooter>
		</Card>
	)
}
