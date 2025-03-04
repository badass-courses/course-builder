import crypto from 'crypto'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'

import { Post } from './types'

/**
 * Updates a post's slug based on a new title
 *
 * If the title has changed, generates a new slug using the new title while preserving
 * the unique identifier part of the existing slug (or generating a new one if needed)
 *
 * @param currentPost - The current post object
 * @param newTitle - The new title for the post
 * @returns The updated slug string
 */
export function updatePostSlug(currentPost: Post, newTitle: string): string {
	if (newTitle !== currentPost.fields.title) {
		const currentSlug = currentPost?.fields?.slug || ''
		const splitSlug = currentSlug.split('~')
		const uniqueId = splitSlug[1] || guid()
		return `${slugify(newTitle)}~${uniqueId}`
	}
	return currentPost.fields.slug || `${slugify(newTitle)}~${guid()}`
}

/**
 * Generates a content hash for a post
 *
 * Creates a SHA-256 hash of the post's key content fields to track content changes
 *
 * @param post - The post object to generate a hash for
 * @returns A SHA-256 hash string representing the post's content
 */
export function generateContentHash(post: Post): string {
	const content = JSON.stringify({
		title: post.fields?.title || '',
		body: post.fields?.body || '',
		description: post.fields?.description || '',
		slug: post.fields?.slug || '',
		// Add any other fields that should be considered for content changes
	})
	return crypto.createHash('sha256').update(content).digest('hex')
}
