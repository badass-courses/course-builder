'use client'

import { CreateResourceForm } from '@/components/resources-crud/create-resource-form'

import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

export function CreateResourceCard({ resourceType }: { resourceType: string }) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>
			<CardContent>
				<CreateResourceForm resourceType={resourceType} />
			</CardContent>
			<CardFooter></CardFooter>
		</Card>
	)
}
