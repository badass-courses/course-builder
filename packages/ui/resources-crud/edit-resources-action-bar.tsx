import * as React from 'react'
import { Archive, ArrowLeft, Undo2 } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { Button } from '../primitives/button'

/**
 * Action bar for editing a resource, with optional breadcrumb navigation.
 *
 * @param resource - The resource being edited
 * @param resourcePath - Path to view the resource
 * @param onSubmit - Save handler
 * @param onPublish - Publish handler
 * @param onArchive - Archive handler
 * @param onUnPublish - Unpublish handler
 * @param isAutoSaving - Whether auto-save is in progress
 * @param breadcrumb - Optional breadcrumb array [{ title, href? }]
 */
export function EditResourcesActionBar({
	onSubmit,
	resource,
	resourcePath,
	onPublish,
	onArchive,
	onUnPublish,
	isAutoSaving = false,
	breadcrumb = [],
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
	breadcrumb?: { title: string; href?: string }[]
}) {
	const [isSubmitting, setIsSubmitting] = React.useState(false)
	const isDisabled = isSubmitting || isAutoSaving

	return (
		<div className="md:bg-muted bg-muted/80 sticky top-0 z-20 flex h-20 w-full flex-col px-1 text-sm backdrop-blur-md sm:text-base md:h-9 md:flex-row md:items-center md:justify-between md:backdrop-blur-none">
			<div className="flex items-center gap-2">
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
				{/* Breadcrumbs */}
				{breadcrumb.length > 0 && (
					<>
						{breadcrumb.map((crumb, idx) => (
							<span key={idx} className="flex items-start gap-1">
								{crumb.href ? (
									<a
										href={crumb.href}
										className="text-muted-foreground hover:text-foreground hover:underline"
									>
										{crumb.title}
									</a>
								) : (
									<span className="text-muted-foreground">{crumb.title}</span>
								)}
								{idx < breadcrumb.length - 1 && (
									<span className="text-muted-foreground">/</span>
								)}
							</span>
						))}
						<span className="text-muted-foreground">/</span>
					</>
				)}
				<span className="truncate text-ellipsis pr-3 font-medium">
					{resource?.fields?.title}{' '}
					<span className="hidden font-mono text-xs font-normal md:inline-block">
						({resource.id})
					</span>
				</span>
			</div>
			<div className="flex items-center justify-center gap-2 md:justify-start">
				{resource.fields?.state === 'draft' && (
					<Button
						onClick={() => {
							onPublish()
						}}
						type="button"
						variant="outline"
						size="sm"
						disabled={isDisabled}
						className="border-primary h-7 disabled:cursor-wait"
					>
						Save & Publish
					</Button>
				)}
				{resource.fields?.state === 'published' && (
					<Button
						onClick={() => {
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
						onClick={() => {
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
					onClick={async () => {
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
