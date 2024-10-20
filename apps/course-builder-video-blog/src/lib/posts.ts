import { courseBuilderAdapter, db } from '@/db'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contributionTypes,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { slugify } from 'inngest'
import { z } from 'zod'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

import { getPost } from './posts-server-functions'

export const PostStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export const PostVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])

export const PostSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string(),
			summary: z.string().optional().nullable(),
			body: z.string().default(''),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('unlisted'),
			slug: z.string(),
		}),
	}),
)

export type Post = z.infer<typeof PostSchema>

export const NewPostSchema = z.object({
	title: z.string().min(2).max(90),
	videoResourceId: z.string().min(4, 'Please upload a video').optional(),
})

export type NewPost = z.infer<typeof NewPostSchema>

export const PostUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string(),
	}),
})

export type PostUpdate = z.infer<typeof PostUpdateSchema>
