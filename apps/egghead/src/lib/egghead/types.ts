import * as z from 'zod'

/** URL-like field that coerces empty strings to null, no strict URL validation */
const urlField = z
	.string()
	.transform((val) => (val === '' ? null : val))
	.nullish()

/**
 * Type for Egghead lesson state
 */
export type EggheadLessonState = 'published' | 'approved' | 'retired'

/**
 * Type for Egghead lesson visibility state
 */
export type EggheadLessonVisibilityState = 'indexed' | 'hidden'

/**
 * Type for Egghead resource type in database
 */
export type EggheadResourceType = 'Lesson' | 'Playlist'

/**
 * Interface for Egghead resource info
 */
export interface EggheadResource {
	id: number
	type: EggheadResourceType
}

/**
 * Base URL for Egghead API v1
 */
export const EGGHEAD_API_V1_BASE_URL = 'https://app.egghead.io/api/v1'

/**
 * Schema for Egghead lessons
 */
export const eggheadLessonSchema = z.object({
	id: z.number(),
	title: z.string(),
	slug: z.string(),
	summary: z.string().nullish(),
	topic_list: z.array(z.string()),
	free_forever: z.boolean(),
	is_pro: z.boolean(),
	body: z.string().nullish(),
	state: z.string(),
	instructor: z.object({
		id: z.number(),
		full_name: z.string().nullish(),
		url: urlField,
		avatar_url: urlField,
	}),
})

export type EggheadLesson = z.infer<typeof eggheadLessonSchema>

/**
 * Schema for Egghead key-value store
 */
export const KvstoreSchema = z.object({
	tags: z.array(z.string()).optional(),
	difficulty: z.string().optional(),
})
export type Kvstore = z.infer<typeof KvstoreSchema>

/**
 * Schema for Egghead database course
 */
export const EggheadDbCourseSchema = z.object({
	id: z.number(),
	access_state: z.string().optional(),
	code_url: z.string().optional(),
	created_at: z.coerce.date().optional(),
	description: z.string().optional(),
	featured: z.boolean().optional(),
	guid: z.string().optional(),
	is_complete: z.boolean().optional(),
	kvstore: KvstoreSchema.optional(),
	owner_id: z.number().optional(),
	price: z.number().optional(),
	published: z.boolean().optional(),
	published_at: z.coerce.date().optional(),
	queue_order: z.number().optional(),
	revshare_percent: z.number().optional(),
	row_order: z.number().optional(),
	shared_id: z.string().optional(),
	site: z.string().optional(),
	slug: z.string().optional(),
	square_cover_content_type: z.string().optional(),
	square_cover_file_name: z.string().optional(),
	square_cover_file_size: z.number().optional(),
	square_cover_processing: z.boolean().optional(),
	square_cover_updated_at: z.coerce.date().optional(),
	state: z.string().optional(),
	summary: z.string().optional(),
	tagline: z.string().optional(),
	title: z.string().optional(),
	tweeted_on: z.coerce.date().optional(),
	updated_at: z.coerce.date().optional(),
	visibility_state: z.string().optional(),
})
export type EggheadDbCourse = z.infer<typeof EggheadDbCourseSchema>

/**
 * Schema for Egghead instructor user profile
 */
export const EggheadCurrentUserInstructorSchema = z.object({
	id: z.number(),
	email: z.string().email().nullish(),
	slug: z.string().nullish(),
	full_name: z.string().nullish(),
	first_name: z.string().nullish(),
	last_name: z.string().nullish(),
	twitter: z.string().nullish(),
	website: urlField,
	bio_short: z.string().nullish(),
	state: z.string().nullish(),
	http_url: urlField,
	path: z.string().nullish(),
	avatar_url: urlField,
	avatar_480_url: urlField,
	lessons_url: urlField,
	lesson_tags: z.array(z.any()).nullish(),
	published_lessons: z.number().nullish(),
	published_courses: z.number().nullish(),
	rss_url: urlField,
	slack_id: z.string().nullish(),
	slack_group_id: z.string().nullish(),
	pending_courses: z.number().nullish(),
	pending_lessons: z.number().nullish(),
	claimed_lessons: z.number().nullish(),
	submitted_lessons: z.number().nullish(),
	approved_lessons: z.number().nullish(),
	reviewing_lessons: z.number().nullish(),
	updated_lessons: z.number().nullish(),
	revenue_url: urlField,
	affiliate_http_url: urlField,
	stats_url: urlField,
	playlists_url: urlField,
})
export type EggheadCurrentUserInstructor = z.infer<
	typeof EggheadCurrentUserInstructorSchema
>

/**
 * Schema for Egghead current user profile
 */
export const EggheadCurrentUserSchema = z.object({
	name: z.string().nullish(),
	id: z.number(),
	email: z.string().nullish(),
	full_name: z.string().nullish(),
	avatar_url: z.string().nullish(),
	contact_id: z.string().nullish(),
	roles: z.array(z.string()).nullish(),
	providers: z.array(z.string()).nullish(),
	created_at: z.number().nullish(),
	is_pro: z.boolean().nullish(),
	is_instructor: z.boolean().nullish(),
	instructor_id: z.number().nullish(),
	username: z.string().nullish(),
	timezone: z.string().nullish(),
	tags: z.array(z.any()).nullish(),
	instructor: EggheadCurrentUserInstructorSchema.nullish(),
	become_user_url: z.string().nullish(),
})
export type EggheadCurrentUser = z.infer<typeof EggheadCurrentUserSchema>
