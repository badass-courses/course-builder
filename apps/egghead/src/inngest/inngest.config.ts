import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

import { syncPostsToEggheadLessons } from './functions/egghead/lessons/sync-posts-to-egghead-lessons'
import { syncPostToEgghead } from './functions/egghead/posts/sync-post-to-egghead'
import { migrateTipsToPosts } from './functions/migrate-tips-to-posts'
import { notifySlack } from './functions/notify-slack-for-post'
import { syncLessonToSanity } from './functions/sanity/lessons/sync-lesson-to-sanity'
import { syncVideoResourceToSanity } from './functions/sanity/video-resources/sync-video-resource-to-sanity'
import { syncVideoResourceData } from './functions/video-resource-created'

export const inngestConfig = {
	client: inngest,
	functions: [
		...courseBuilderCoreFunctions.map(({ config, trigger, handler }) =>
			inngest.createFunction(config, trigger, handler),
		),
		imageResourceCreated,
		syncPostToEgghead,
		migrateTipsToPosts,
		syncLessonToSanity,
		syncVideoResourceToSanity,
		notifySlack,
		syncVideoResourceData,
		syncPostsToEggheadLessons,
	],
}
