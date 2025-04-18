import type { List } from '@/lib/lists'
import type { Post, PostSchema } from '@/lib/posts'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas'

import { ArticleMetadataFormFields } from './article-metadata-form-fields'
import { EventMetadataFormFields } from './event-metadata-form-fields'

interface MetadataFormFieldsSwitcherProps {
	post: Post
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResource?: VideoResource | null
	videoResourceId?: string | null
	listsLoader: Promise<List[]>
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
}

/**
 * Metadata form fields switcher component
 *
 * Selects the appropriate metadata form component based on post type.
 * Different post types have different metadata requirements,
 * so we use this switcher to render the appropriate form.
 */
export function MetadataFormFieldsSwitcher(
	props: MetadataFormFieldsSwitcherProps,
) {
	const { post, form, ...rest } = props

	switch (form.watch('fields.postType')) {
		case 'article':
			return <ArticleMetadataFormFields post={post} form={form} {...rest} />
		case 'event':
			return <EventMetadataFormFields post={post} form={form} {...rest} />
		default:
			return <ArticleMetadataFormFields post={post} form={form} {...rest} />
	}
}
