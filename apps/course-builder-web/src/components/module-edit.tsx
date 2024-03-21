'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { EditTutorialForm } from '@/app/tutorials/[module]/edit/_form'
import Tree from '@/components/lesson-list/tree'
import { CreateResourceForm } from '@/components/resources-crud/create-resource-form'
import { db } from '@/db'
import { contentResourceResource } from '@/db/schema'
import { addResourceToTutorial } from '@/lib/tutorials-query'

import { ContentResource } from '@coursebuilder/core/types'
import { Button, Input, Label, Textarea } from '@coursebuilder/ui'

export default function Component({
	tutorial,
}: {
	tutorial: ContentResource & {
		resources: {
			position: number
			resource: ContentResource
			resourceId: string
			resourceOfId: string
		}[]
	}
}) {
	const router = useRouter()
	return (
		<div key="1" className="grid grid-cols-8 gap-4 p-4">
			<div className="col-span-2">
				<h1 className="text-2xl font-bold">{tutorial.fields?.title}</h1>
				{tutorial.fields?.description && (
					<p className="my-2 text-sm">{tutorial.fields?.description}</p>
				)}
				<div className="space-y-2">
					<CreateResourceForm
						resourceType={'lesson'}
						onCreate={async (resource) => {
							await addResourceToTutorial({
								resource,
								tutorialId: tutorial.id,
							})
							router.refresh()
						}}
					/>
					<Button className="mt-2" variant="outline">
						+ add a lesson
					</Button>
					<Button className="mt-2" variant="outline">
						+ add section
					</Button>
					<Button className="mt-2" variant="outline">
						+ add resource
					</Button>
				</div>
				<div className="flex flex-col">
					sss
					<Tree
						initialData={[
							...(tutorial.resources
								? tutorial.resources.map((resourceItem) => {
										console.log(resourceItem)
										return {
											id: resourceItem.resource.id,
											label: resourceItem.resource.fields?.title || 'lessonzzz',
											type: resourceItem.resource.type,
											children: [],
											itemData: resourceItem,
										}
									})
								: []),
						]}
					/>
				</div>
			</div>
		</div>
	)
}
