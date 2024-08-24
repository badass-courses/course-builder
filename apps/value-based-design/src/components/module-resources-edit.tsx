'use client'

import * as React from 'react'
import { useReducer } from 'react'
import { useRouter } from 'next/navigation'
import {
	getInitialTreeState,
	treeStateReducer,
} from '@/components/lesson-list/data/tree'
import Tree from '@/components/lesson-list/tree'
import { addResourceToModule } from '@/lib/modules-query'
import {
	createResource,
	createResourceWithVideo,
} from '@/lib/resources/create-resources'
import { getVideoResource } from '@/lib/video-resource-query'
import { Plus } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { NewResourceWithVideoForm } from '@coursebuilder/react-rsc/client'
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'
import { CreateResourceForm } from '@coursebuilder/ui/resources-crud/create-resource-form'

import { LessonUploader } from './resources-crud/lesson-uploader'

export default function ModuleResourcesEdit({
	module,
}: {
	module: ContentResource
}) {
	const [isAddingLesson, setIsAddingLesson] = React.useState(false)
	const [isAddingSection, setIsAddingSection] = React.useState(false)

	const initialData = [
		...(module.resources
			? module.resources.map((resourceItem) => {
					if (!resourceItem.resource) {
						throw new Error('resourceItem.resource is required')
					}
					const resources = resourceItem.resource.resources ?? []
					return {
						id: resourceItem.resource.id,
						label: resourceItem.resource.fields?.title,
						type: resourceItem.resource.type,
						children: resources.map((resourceItem: any) => {
							if (!resourceItem.resource) {
								throw new Error('resourceItem.resource is required')
							}
							return {
								id: resourceItem.resource.id,
								label: resourceItem.resource.fields?.title,
								type: resourceItem.resource.type,
								children: [],
								itemData: resourceItem as any,
							}
						}),
						itemData: resourceItem as any,
					}
				})
			: []),
	]
	const [state, updateState] = useReducer(
		treeStateReducer,
		initialData,
		getInitialTreeState,
	)
	const router = useRouter()

	const handleResourceCreated = async (resource: ContentResource) => {
		const resourceItem = await addResourceToModule({
			resource,
			moduleId: module.id,
		})

		if (resourceItem) {
			updateState({
				type: 'add-item',
				itemId: resourceItem.resource.id,
				item: {
					id: resourceItem.resource.id,
					label: resourceItem.resource.fields?.title,
					type: resourceItem.resource.type,
					children: [],
					itemData: resourceItem as any,
				},
			})
		}

		setIsAddingSection(false)
		setIsAddingLesson(false)
		router.refresh()
	}

	return (
		<>
			<span className="px-5 text-lg font-bold">Resources</span>
			<Tree
				rootResource={module as ContentResource}
				rootResourceId={module.id}
				state={state}
				updateState={updateState}
			/>
			<div className="mt-5 flex w-full flex-row gap-1 px-3">
				<Dialog
					open={isAddingLesson}
					onOpenChange={() => {
						setIsAddingLesson((prev) => !prev)
					}}
				>
					<DialogTrigger asChild>
						<Button variant="outline" type="button" className="w-full gap-0.5">
							<Plus className="h-4 w-4" /> Lesson
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								Add Lesson to {module?.fields?.title} {module?.type}
							</DialogTitle>
							<DialogDescription></DialogDescription>
						</DialogHeader>
						<div className="border-t pt-5">
							<NewResourceWithVideoForm
								availableResourceTypes={['lesson', 'problem', 'solution']}
								onResourceCreated={async (
									resource: ContentResource,
									title: string,
								) => {
									return await handleResourceCreated(resource)
								}}
								createResource={createResourceWithVideo}
								getVideoResource={getVideoResource}
							>
								{(handleSetVideoResourceId: (id: string) => void) => {
									return (
										<LessonUploader
											setVideoResourceId={handleSetVideoResourceId}
										/>
									)
								}}
							</NewResourceWithVideoForm>
						</div>
					</DialogContent>
				</Dialog>
				<Dialog
					open={isAddingSection}
					onOpenChange={() => {
						setIsAddingSection((prev) => !prev)
					}}
				>
					<DialogTrigger asChild>
						<Button variant="outline" type="button" className="w-full gap-0.5">
							<Plus className="h-4 w-4" /> Section
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								Add Section to {module?.fields?.title} {module?.type}
							</DialogTitle>
							<DialogDescription></DialogDescription>
						</DialogHeader>
						<div className="border-t pt-5">
							<CreateResourceForm
								resourceType={'section'}
								onCreate={handleResourceCreated}
								createResource={createResource}
							/>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</>
	)
}
