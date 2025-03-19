import { z } from 'zod'

import { SanityCourseSchema } from './schemas'

/**
 * Common Sanity types
 */

/**
 * Sanity image schema
 */
export type Image = {
	_type?: string
	label?: string
	url?: string
	_key?: string
}

/**
 * Sanity slug schema
 */
export type Slug = {
	current?: string
	_type?: string
}

/**
 * Common system fields for Sanity documents
 */
export type SystemFields = {
	_id?: string
	_type?: string
	_rev?: string
	_createdAt?: Date
	_updatedAt?: Date
}

/**
 * Software library document in Sanity
 */
export type SanitySoftwareLibraryDocument = {
	_type: 'software-library'
	_id: string
	slug: {
		current: string
	}
}

/**
 * Reference to a Sanity document
 */
export type SanityReference = {
	_type: 'reference'
	_ref: string
}

/**
 * Reference to a Sanity document
 */
export type SanityArrayElementReference = SanityReference & {
	_key: string
}

/**
 * Software library array object in Sanity
 */
export type SoftwareLibraryArrayObject = {
	_type?: string
	_key?: string
	library?: SanityReference
}

/**
 * Video resource document in Sanity
 */
export type SanityVideoResourceDocument = {
	_createdAt?: string
	_id?: string
	_rev?: string
	_type: 'videoResource'
	_updatedAt?: string
	filename?: string
	mediaUrls: {
		hlsUrl: string
		dashUrl?: string
	}
	muxAsset?: {
		muxAssetId?: string
		muxPlaybackId?: string
	}
	transcript?: {
		srt?: string
		text?: string
	}
}

/**
 * Lesson document in Sanity
 */
export type SanityLessonDocument = {
	_type: 'lesson'
	_id?: string
	title: string
	slug: {
		_type: 'slug'
		current: string
	}
	description?: string
	railsLessonId?: string | number
	softwareLibraries?: SoftwareLibraryArrayObject[]
	collaborators?: SanityArrayElementReference[]
	status?: string
	accessLevel?: 'free' | 'pro'
}

/**
 * Collaborator in Sanity
 */
export type SanityCollaborator = SystemFields & {
	person?: SanityReference
	title?: string
	eggheadInstructorId?: string
	role?: string
	department?: string
}

/**
 * Course document in Sanity
 */
export type SanityCourse = z.infer<typeof SanityCourseSchema>

/**
 * Position input item for ordering resources
 */
export type PositionInputItem = {
	resourceId: string
	position: number
}
