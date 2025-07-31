import { z } from 'zod'

// Import directly using relative paths
import {
	MinimalPostSchema,
	NewPostSchema,
	PostAccessSchema,
	PostActionSchema,
	PostSchema,
	PostStateSchema,
	PostTypeSchema,
	PostUpdateSchema,
	PostVisibilitySchema,
} from './schemas'

// Type exports that will be inferred from schemas
export type PostAction = z.infer<typeof PostActionSchema>
export type PostState = z.infer<typeof PostStateSchema>
export type PostVisibility = z.infer<typeof PostVisibilitySchema>
export type PostAccess = z.infer<typeof PostAccessSchema>
export type PostType = z.infer<typeof PostTypeSchema>
export type Post = z.infer<typeof PostSchema>
export type NewPost = z.infer<typeof NewPostSchema>
export type PostUpdate = z.infer<typeof PostUpdateSchema>
export type MinimalPost = z.infer<typeof MinimalPostSchema>

// Constants
export const POST_TYPES_WITH_VIDEO = ['lesson', 'podcast', 'tip']
