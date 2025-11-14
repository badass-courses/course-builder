import { z } from 'zod'

import { ListSchema } from './lists'
import { PostSchema } from './posts'

export const PostOrListSchema = z.discriminatedUnion('type', [
	PostSchema.extend({ type: z.literal('post') }),
	ListSchema.extend({ type: z.literal('list') }),
])

export type PostOrList = z.infer<typeof PostOrListSchema>
