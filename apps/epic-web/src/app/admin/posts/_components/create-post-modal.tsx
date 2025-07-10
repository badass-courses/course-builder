'use client'

import * as React from 'react'
import { PostType } from '@/lib/posts'
import { FilePlus2, Loader2 } from 'lucide-react'

import { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'

import { CreatePost } from './create-post'

/**
 * Props for the CreatePostModal component.
 * Provides configuration for dialog behavior and post creation handling.
 */
export interface CreatePostModalProps {
	/**
	 * Callback fired when the dialog's open state changes
	 */
	onOpenChange?: (isOpen: boolean) => void
	/**
	 * Override default navigation behavior after resource creation
	 */
	onResourceCreated?: (resource: ContentResource) => Promise<void>
	/**
	 * Whether to show the default trigger button
	 * @default true
	 */
	showTrigger?: boolean
	/**
	 * Control the dialog's open state
	 * @default false
	 */
	open?: boolean
	/**
	 * The default type of resource to create
	 * @default 'article'
	 */
	defaultResourceType?: string
	/**
	 * List of allowed resource types that can be created in this context
	 * @default ['article']
	 */
	availableResourceTypes?: string[]
	/**
	 * List of top-level resource types (not post subtypes)
	 */
	topLevelResourceTypes?: string[]
	/**
	 * Custom title for the dialog header
	 * @default 'New Post'
	 */
	title?: string
	/**
	 * Whether to enable video upload
	 * @default true
	 */
	uploadEnabled?: boolean
	/**
	 * Custom label for the trigger button text
	 * @default "New Post"
	 */
	triggerLabel?: string
}

/**
 * Modal dialog for creating new post resources.
 *
 * @example
 * ```tsx
 * <CreatePostModal
 *   onResourceCreated={async (resource) => {
 *     // Custom handling after creation
 *   }}
 *   defaultResourceType="article"
 *   availableResourceTypes={['article', 'podcast']}
 * />
 * ```
 */
export function CreatePostModal({
	onOpenChange,
	onResourceCreated,
	showTrigger = true,
	open,
	defaultResourceType = 'article',
	availableResourceTypes = ['article'],
	topLevelResourceTypes = [],
	title = 'New Post',
	uploadEnabled = true,
	triggerLabel = 'New Post',
}: CreatePostModalProps) {
	const [isOpen, setIsOpen] = React.useState(open)
	const [isProcessing, setIsProcessing] = React.useState(false)

	React.useEffect(() => {
		setIsOpen(open)
	}, [open])

	const handleResourceCreated = async (resource: ContentResource) => {
		setIsProcessing(true)
		if (onResourceCreated) {
			await onResourceCreated(resource)
		}
		// Reset processing state and allow modal to be closed
		setIsProcessing(false)
		// Auto-close the dialog after successful creation when no custom
		// onResourceCreated handler is provided
		if (!onResourceCreated) {
			setIsOpen(false)
		}
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (isProcessing) return // prevent closing while processing
				if (onOpenChange) {
					onOpenChange(open)
				}
				setIsOpen(open)
			}}
		>
			{showTrigger && (
				<DialogTrigger asChild>
					<Button
						variant="default"
						type="button"
						className=" gap-1"
						onClick={() => setIsOpen(true)}
					>
						<FilePlus2 className="h-4 w-4" /> {triggerLabel}
					</Button>
				</DialogTrigger>
			)}
			<DialogContent>
				{title && (
					<DialogHeader className="">
						<DialogTitle className="font-heading mb-3 flex items-center gap-2 text-2xl font-semibold">
							{isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
							{isProcessing ? 'Creating...' : title}
						</DialogTitle>
					</DialogHeader>
				)}
				<CreatePost
					onResourceCreated={handleResourceCreated}
					defaultResourceType={defaultResourceType}
					availableResourceTypes={availableResourceTypes}
					topLevelResourceTypes={topLevelResourceTypes}
					uploadEnabled={uploadEnabled}
				/>
			</DialogContent>
		</Dialog>
	)
}
