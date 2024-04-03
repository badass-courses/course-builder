import * as React from 'react'

import { ContentResource } from '@coursebuilder/core/types'

import { Button } from '../primitives/button'

export function EditResourcesActionBar({
	onSubmit,
	resource,
	resourcePath,
	onPublish,
	onArchive,
}: {
	resource: ContentResource & {
		fields?: {
			body?: string | null
			title?: string | null
			slug: string
		}
	}
	onSubmit: () => void
	onPublish: () => void
	onArchive: () => void
	resourcePath: string
}) {
	return (
		<div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
			<div className="flex items-center gap-2">
				<Button className="px-0" asChild variant="link">
					<a href={resourcePath} className="aspect-square">
						←
					</a>
				</Button>
				<span className="font-medium">
					{resource.type.toUpperCase()}{' '}
					<span className="hidden font-mono text-xs font-normal md:inline-block">
						({resource.id})
					</span>
				</span>
			</div>
			<div className="flex items-center gap-2">
				{resource.fields?.state === 'draft' && (
					<Button
						onClick={(e) => {
							onPublish()
						}}
						type="button"
						variant="default"
						size="sm"
						className="h-7 disabled:cursor-wait"
					>
						Publish
					</Button>
				)}
				{resource.fields?.state === 'published' && (
					<Button
						onClick={(e) => {
							onPublish()
						}}
						type="button"
						variant="default"
						size="sm"
						className="h-7 disabled:cursor-wait"
					>
						Archive
					</Button>
				)}
				<Button
					onClick={(e) => {
						onSubmit()
					}}
					type="button"
					variant="default"
					size="sm"
					className="h-7 disabled:cursor-wait"
				>
					Save
				</Button>
			</div>
		</div>
	)
}
