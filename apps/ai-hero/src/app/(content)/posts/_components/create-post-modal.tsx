'use client'

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
 * Props for the CreatePostModal component,
 * allowing a custom onOpenChange callback for controlling
 * the dialog state from outside, and a custom onResourceCreated callback
 * that overrides the default post-creation navigation.
 */
export interface CreatePostModalProps {
	/**
	 * Called whenever the dialog is opened or closed.
	 */
	onOpenChange?: (isOpen: boolean) => void
	/**
	 * If provided, overrides the default router.push on resource creation.
	 */
	onResourceCreated?: (resource: ContentResource) => Promise<void>
	showTrigger?: boolean
	open?: boolean
	defaultResourceType?: PostType
	availableResourceTypes?: PostType[]
	title?: string
}

/**
 * Creates a "New Post" modal using our CreatePost component.
 * The modal's open state is controlled by the parent component.
 * If `onResourceCreated` is provided, it overrides the default router-based nav.
 */
export function CreatePostModal({
	onOpenChange,
	onResourceCreated,
	showTrigger = true,
	open,
	defaultResourceType = 'article',
	availableResourceTypes = ['article', 'lesson'],
	title = 'New Post',
}: CreatePostModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{showTrigger && (
				<DialogTrigger asChild>
					<Button variant="default" type="button" className="w-full gap-1">
						<FilePlus2 className="h-4 w-4" /> New Post
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
					defaultResourceType={defaultResourceType}
					availableResourceTypes={availableResourceTypes}
				/>
			</DialogContent>
		</Dialog>
	)
}
