/**
 * This file is preserved for backward compatibility.
 * All functionality has been moved to the `sanity` directory.
 *
 * NOTE: This file can only re-export async server functions.
 * For types and non-async utilities, import directly from './sanity'.
 */

// Re-export async server functions only
export {
	// Lesson
	createSanityVideoResource,
	replaceSanityLessonResources,
	patchSanityLessonWithVideoResourceReference,
	getSanityLessonForEggheadLessonId,
	updateSanityLesson,
	createSanityLesson,

	// Collaborator
	getSanityCollaborator,
	syncInstructorToSanity,

	// Software Library
	getSanitySoftwareLibrary,

	// Course
	createSanityCourse,
	getSanityCourseForEggheadCourseId,
	addLessonToSanityCourse,
	removeLessonFromSanityCourse,
	reorderResourcesInSanityCourse,
	updateSanityCourseMetadata,
	writeTagsToSanityResource,
	syncSanityResourceInstructor,
} from './sanity'
