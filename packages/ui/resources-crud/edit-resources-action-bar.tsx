import * as React from 'react'
import {
	Archive,
	ArrowLeft,
	ArrowLeftToLine,
	ChevronLeftCircle,
	SkipBack,
	Undo,
	Undo2,
} from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { Button } from '../primitives/button'

export function EditResourcesActionBar({
	onSubmit,
	resource,
	resourcePath,
	onPublish,
	onArchive,
	onUnPublish,
	isAutoSaving = false,
}: {
	resource: ContentResource & {
		fields?: {
			body?: string | null
			title?: string | null
			slug: string
			state?: string
		}
	}
	onSubmit: () => Promise<void>
	onPublish: () => void
	onUnPublish: () => void
	onArchive: () => void
	resourcePath: string
	isAutoSaving?: boolean
}) {
	const [isSubmitting, setIsSubmitting] = React.useState(false)
	const isDisabled = isSubmitting || isAutoSaving

	return (
		<div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
			<div className="flex items-center">
				<Button
					title={`View ${resource.type}`}
					className="aspect-square p-0"
					asChild
					variant="link"
				>
					<a href={resourcePath}>
						<ArrowLeft className="w-4" />
					</a>
				</Button>
				<span className="font-medium">
					{resource?.fields?.title} {/* ({resource.type.toUpperCase()})*/}
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
						disabled={isDisabled}
						className="h-7 disabled:cursor-wait"
					>
						Save & Publish
					</Button>
				)}
				{resource.fields?.state === 'published' && (
					<Button
						onClick={(e) => {
							onArchive()
						}}
						type="button"
						variant="ghost"
						size="sm"
						disabled={isDisabled}
						className="h-7 gap-1 px-2 disabled:cursor-wait"
					>
						<Archive className="w-3 opacity-75" />
						Archive
					</Button>
				)}
				{resource.fields?.state === 'published' && (
					<Button
						onClick={(e) => {
							onUnPublish()
						}}
						type="button"
						variant="ghost"
						size="sm"
						disabled={isDisabled}
						className="h-7 gap-1 px-2 disabled:cursor-wait"
					>
						<Undo2 className="w-3 opacity-75" />
						Return to Draft
					</Button>
				)}
				<Button
					onClick={async (e) => {
						setIsSubmitting(true)
						await onSubmit().then(() => {
							setIsSubmitting(false)
						})
					}}
					type="button"
					variant="default"
					size="sm"
					disabled={isDisabled}
					className="relative h-7 w-[90px] disabled:cursor-wait"
				>
					<span className="absolute left-1/2 -translate-x-1/2">
						{isAutoSaving ? 'Auto-saving...' : isSubmitting ? 'Saving' : 'Save'}
					</span>
				</Button>
			</div>
		</div>
	)
}
