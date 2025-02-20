import * as React from 'react'
import { PostType } from '@/lib/posts'
import { FilePlus2 } from 'lucide-react'

import { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
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
	defaultResourceType?: PostType
	/**
	 * List of allowed resource types that can be created
	 * @default ['article', 'lesson']
	 */
	availableResourceTypes?: PostType[]
	/**
	 * Custom title for the dialog header
	 * @default 'New Post'
	 */
	title?: string
	/**
	 * Parent lesson ID when creating a solution
	 */
	parentLessonId?: string
	/**
	 * Whether this modal is being used to create a solution
	 */
	isSolutionContext?: boolean
}

/**
 * A modal dialog component for creating new posts or lessons.
 * Provides a form interface wrapped in a dialog with optional trigger button.
 *
 * @example
 * ```tsx
 * <CreatePostModal
 *   onResourceCreated={async (resource) => {
 *     // Custom handling after creation
 *   }}
 *   defaultResourceType="lesson"
 * />
 * ```
 */
export function CreatePostModal({
	onOpenChange,
	onResourceCreated,
	showTrigger = true,
	open,
	defaultResourceType = 'article',
	availableResourceTypes = ['article', 'lesson'],
	title = 'New Post',
	parentLessonId,
	isSolutionContext = false,
}: CreatePostModalProps) {
	const [isOpen, setIsOpen] = React.useState(open)

	// Override available types and default type for solution context
	const effectiveResourceTypes: PostType[] = isSolutionContext
		? ['solution']
		: availableResourceTypes
	const effectiveDefaultType: PostType = isSolutionContext
		? 'solution'
		: defaultResourceType

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
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
						className="w-full gap-1"
						onClick={() => setIsOpen(true)}
					>
						<FilePlus2 className="h-4 w-4" />{' '}
						{isSolutionContext ? 'Add Solution' : 'New Post'}
					</Button>
				</DialogTrigger>
			)}
			<DialogContent>
				{title && (
					<DialogHeader className="fluid-xl font-heading mb-3 font-semibold">
						{title}
					</DialogHeader>
				)}
				<CreatePost
					onResourceCreated={onResourceCreated}
					defaultResourceType={effectiveDefaultType}
					availableResourceTypes={effectiveResourceTypes}
					parentLessonId={parentLessonId}
				/>
			</DialogContent>
		</Dialog>
	)
}
