'use server'

import { Post } from '@/lib/posts'

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

/**
 * Gets a lesson from the Egghead API by its ID
 * @param eggheadLessonId - The Egghead lesson ID
 * @returns The Egghead lesson data
 */
export async function getEggheadLesson(eggheadLessonId: number) {
	const lesson = await fetch(
		`https://app.egghead.io/api/v1/lessons/${eggheadLessonId}`,
	).then((res) => res.json())

	return lesson
}

/**
 * Gets a playlist from the Egghead API by its ID
 * @param eggheadPlaylistId - The Egghead playlist ID
 * @returns The Egghead playlist data
 */
export async function getEggheadPlaylist(eggheadPlaylistId: number) {
	const playlist = await fetch(
		`https://app.egghead.io/api/v1/playlists/${eggheadPlaylistId}`,
	).then((res) => res.json())

	return playlist
}
