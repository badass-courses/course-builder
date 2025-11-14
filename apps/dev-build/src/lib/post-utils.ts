import crypto from 'crypto'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'

import { type Post } from './posts'

export function updatePostSlug(currentPost: Post, newTitle: string): string {
	if (newTitle !== currentPost.fields.title) {
		const splitSlug = currentPost?.fields.slug.split('~') || ['', guid()]
		return `${slugify(newTitle)}~${splitSlug[1] || guid()}`
	}
	return currentPost.fields.slug
}

export function generateContentHash(post: Post): string {
	const content = JSON.stringify({
		title: post.fields.title,
		body: post.fields.body,
		description: post.fields.description,
		slug: post.fields.slug,
	})
	return crypto.createHash('sha256').update(content).digest('hex')
}
