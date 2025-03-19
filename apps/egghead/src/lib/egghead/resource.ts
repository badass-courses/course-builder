'use server'

import { Post } from '@/lib/posts'

import { getEggheadPlaylist } from './course'
import { getEggheadLesson } from './lesson'

/**
 * Gets the appropriate Egghead resource based on post type
 * @param post - The post for which to get the Egghead resource
 * @returns The Egghead resource (lesson or playlist)
 */
export async function getEggheadResource(post: Post) {
	switch (post.fields.postType) {
		case 'lesson':
			if (!post.fields.eggheadLessonId) {
				throw new Error(
					`eggheadLessonId is required on ${post.id} to get egghead resource`,
				)
			}
			return getEggheadLesson(post.fields.eggheadLessonId)
		case 'course':
			if (!post.fields.eggheadPlaylistId) {
				throw new Error(
					`eggheadPlaylistId is required on ${post.id} to get egghead resource`,
				)
			}
			return getEggheadPlaylist(post.fields.eggheadPlaylistId)
		default:
			throw new Error('Unsupported post type')
	}
}
