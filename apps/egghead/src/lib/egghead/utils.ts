'use server'

import { PostAccess, PostAction, PostState, PostVisibility } from '@/lib/posts'

import { EggheadLessonState, EggheadLessonVisibilityState } from './types'

/**
 * Determines whether to set pro access for Egghead content based on post access
 * @param access - The post access level
 * @returns true for pro content, false for free content
 */
export async function determineEggheadAccess(access: PostAccess) {
	return access === 'pro' ? true : false
}

/**
 * Determines the visibility state for Egghead content based on post visibility and state
 * @param visibility - The post visibility
 * @param state - The post state
 * @returns The appropriate Egghead visibility state
 */
export async function determineEggheadVisibilityState(
	visibility: PostVisibility,
	state: PostState,
): Promise<EggheadLessonVisibilityState> {
	return visibility === 'public' && state === 'published' ? 'indexed' : 'hidden'
}

/**
 * Determines the appropriate Egghead lesson state based on action and current state
 * @param action - The post action being performed
 * @param currentState - The current post state
 * @returns The appropriate Egghead lesson state
 */
export async function determineEggheadLessonState(
	action: PostAction,
	currentState: PostState,
): Promise<EggheadLessonState> {
	switch (action) {
		case 'publish':
			return 'published'
		case 'unpublish':
			return 'approved'
		case 'archive':
			return 'retired'
		default:
			return currentState === 'published'
				? 'published'
				: currentState === 'archived'
					? 'retired'
					: 'approved'
	}
}
