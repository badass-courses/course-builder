// Re-export types
export * from './types'

// Re-export schemas
export * from './schemas'

// Re-export utility functions
export * from './utils'

// Re-export module functionality
export {
	createSanityVideoResource,
	getSanityLessonForEggheadLessonId,
	patchSanityLessonWithVideoResourceReference,
	replaceSanityLessonResources,
	updateSanityLesson,
	createSanityLesson,
} from './lesson'

export { getSanityCollaborator, syncInstructorToSanity } from './collaborator'

export {
	createSanityCourse,
	getSanityCourseForEggheadCourseId,
	addLessonToSanityCourse,
	removeLessonFromSanityCourse,
	reorderResourcesInSanityCourse,
	updateSanityCourseMetadata,
	writeTagsToSanityResource,
	syncSanityResourceInstructor,
} from './course'

export { getSanitySoftwareLibrary } from './softwarelibrary'
