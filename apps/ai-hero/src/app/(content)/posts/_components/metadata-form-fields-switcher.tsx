import React from 'react'
import type { List } from '@/lib/lists'
import type { Post, PostSchema } from '@/lib/posts'
import type { Tag } from '@/lib/tags'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import type { VideoResource } from '@coursebuilder/core/schemas/video-resource'

import { ArticleMetadataFormFields } from './article-metadata-form-fields'
import { LessonMetadataFormFields } from './lesson-metadata-form-fields'
import { SolutionMetadataFormFields } from './solution-metadata-form-fields'

interface MetadataFormFieldsSwitcherProps {
	post: Post
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResourceId?: string | null
	tagLoader: Promise<Tag[]>
	listsLoader: Promise<List[]>
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
}

/**
 * Renders metadata form fields based on the post type.
 * For lessons, a dedicated lesson metadata form is rendered,
 * while articles use the default article metadata form.
 */
export function MetadataFormFieldsSwitcher(
	props: MetadataFormFieldsSwitcherProps,
) {
	const { post, ...rest } = props

	if (post.fields.postType === 'lesson') {
		return <LessonMetadataFormFields post={post} {...rest} />
	}

	if (post.fields.postType === 'solution') {
		return <SolutionMetadataFormFields post={post} {...rest} />
	}

	return <ArticleMetadataFormFields post={post} {...rest} />
}
