'use client'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { Card, CardContent, CardFooter, CardHeader } from '../primitives/card'
import { CreateResourceForm, NewResource } from './create-resource-form'

export function CreateResourceCard({
	resourceType,
	onCreate,
	createResource,
}: {
	resourceType: string
	onCreate: (resource: ContentResource) => Promise<void>
	createResource: (values: NewResource) => Promise<ContentResource | null>
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
			<CardContent>
				<CreateResourceForm
					resourceType={resourceType}
					onCreate={onCreate}
					createResource={createResource}
				/>
			</CardContent>
			<CardFooter></CardFooter>
		</Card>
	)
}
