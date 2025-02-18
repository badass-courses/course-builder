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
	onOpenChange = () => {},
	onResourceCreated,
	showTrigger = true,
	open = false,
	defaultResourceType = 'article',
	availableResourceTypes = ['article', 'lesson'],
	title = 'New Post',
}: CreatePostModalProps) {
	const [isOpen, setIsOpen] = React.useState(open)
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
						<FilePlus2 className="h-4 w-4" /> New Post
					</Button>
				</DialogTrigger>
			)}
			<DialogContent>
				<DialogHeader className="fluid-3xl font-heading font-semibold">
					{title}
				</DialogHeader>
				<CreatePost
					onResourceCreated={onResourceCreated}
					defaultResourceType={defaultResourceType}
					availableResourceTypes={availableResourceTypes}
				/>
			</DialogContent>
		</Dialog>
	)
}
