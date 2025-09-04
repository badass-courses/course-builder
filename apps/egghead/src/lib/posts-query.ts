'use server'

import 'server-only'

// Import the playlist operations from the new module
import {
	addEggheadLessonToPlaylist,
	addResourceToResource,
	removeEggheadLessonFromPlaylist,
	removePostFromCoursePost,
	removeSection,
	updateResourcePosition,
	updateResourcePositions,
} from './posts/playlists'
// Import the read operations from the new module
import {
	countAllMinimalPosts,
	countAllMinimalPostsForUser,
	getAllMinimalPosts,
	getAllMinimalPostsForUser,
	getAllPostIds,
	getAllPosts,
	getAllPostsForUser,
	getCachedAllMinimalPosts,
	getCachedAllMinimalPostsForUser,
	getCachedAllPosts,
	getCachedAllPostsForUser,
	getCachedMinimalPosts,
	getCachedMinimalPostsForUser,
	getCachedPost,
	getCoursesForPost,
	getLatestLessonsForUser,
	getMinimalProductInfoWithoutUser,
	getPost,
	getPostTags,
	searchLessons,
} from './posts/read'
// Import the write operations from the new module
import {
	addTagToPost,
	createPost,
	deletePost,
	deletePostFromDatabase,
	getVideoDuration,
	removeTagFromPost,
	setPrimaryTagToPost,
	updatePost,
	updatePostInstructor,
	updatePostTags,
	writePostUpdateToDatabase,
} from './posts/write'

// Re-export them to maintain backwards compatibility
export {
	// Read operations
	searchLessons,
	getPost,
	getCachedPost,
	getAllPosts,
	getCachedAllPosts,
	getAllPostsForUser,
	getCachedAllPostsForUser,
	getAllMinimalPosts,
	getAllMinimalPostsForUser,
	getCachedAllMinimalPosts,
	getCachedAllMinimalPostsForUser,
	getCachedMinimalPosts,
	getCachedMinimalPostsForUser,
	getPostTags,
	getCoursesForPost,
	getAllPostIds,
	getLatestLessonsForUser,
	countAllMinimalPosts,
	countAllMinimalPostsForUser,

	// Write operations
	createPost,
	updatePost,
	deletePost,
	addTagToPost,
	setPrimaryTagToPost,
	updatePostTags,
	removeTagFromPost,
	updatePostInstructor,
	writePostUpdateToDatabase,
	deletePostFromDatabase,
	getVideoDuration,
	getMinimalProductInfoWithoutUser,

	// Playlist operations
	addEggheadLessonToPlaylist,
	removePostFromCoursePost,
	removeEggheadLessonFromPlaylist,
	addResourceToResource,
	updateResourcePosition,
	updateResourcePositions,
	removeSection,
}

// All function implementations have been moved to their respective modules
// in /src/lib/posts/read.ts, /src/lib/posts/write.ts, and /src/lib/posts/playlists.ts
