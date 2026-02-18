import * as React from 'react'
import { Archive, ArrowLeft, Undo2 } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { Button } from '../primitives/button'
import Spinner from '../primitives/spinner'

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
	onPublish: () => Promise<void>
	onUnPublish: () => Promise<void>
	onArchive: () => Promise<void>
	resourcePath: string
	isAutoSaving?: boolean
	breadcrumb?: { title: string; href?: string }[]
}) {
	const [pending, setPending] = React.useState<
		'save' | 'publish' | 'archive' | 'unpublish' | null
	>(null)
	const isDisabled = !!pending || isAutoSaving

	// Clear pending when resource state changes (server response arrived)
	React.useEffect(() => {
		setPending(null)
	}, [resource.fields?.state])

	const run = async (
		key: 'save' | 'publish' | 'archive' | 'unpublish',
		fn: () => Promise<void>,
	) => {
		setPending(key)
		try {
			await fn()
		} finally {
			// Only clear for save — state-changing actions stay pending
			// until resource.fields.state updates via the effect above
			if (key === 'save') {
				setPending(null)
			}
		}
	}

	return (
		<div className="md:bg-muted bg-muted/80 sticky top-0 z-20 flex h-20 w-full flex-col px-1 text-sm backdrop-blur-md sm:text-base md:h-9 md:flex-row md:items-center md:justify-between md:backdrop-blur-none">
			<div className="flex items-center gap-2">
				<Button
					title={`View ${resource.type}`}
					className="aspect-square text-balance p-0"
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
				{pending ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled
						className="h-7 gap-1.5 disabled:cursor-wait"
					>
						<Spinner className="h-3 w-3" />
						{pending === 'publish' && 'Publishing…'}
						{pending === 'archive' && 'Archiving…'}
						{pending === 'unpublish' && 'Reverting to draft…'}
						{pending === 'save' && 'Saving…'}
					</Button>
				) : (
					<>
						{resource.fields?.state === 'draft' && (
							<Button
								onClick={() => run('publish', onPublish)}
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
								onClick={() => run('archive', onArchive)}
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
								onClick={() => run('unpublish', onUnPublish)}
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
							onClick={() => run('save', onSubmit)}
							type="button"
							variant="default"
							size="sm"
							disabled={isDisabled}
							className="h-7 gap-1.5 disabled:cursor-wait"
						>
							{isAutoSaving && <Spinner className="h-3 w-3" />}
							{isAutoSaving ? 'Auto-saving…' : 'Save'}
						</Button>
					</>
				)}
			</div>
		</div>
	)
}
