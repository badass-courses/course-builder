import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

import { migrateTipsToPosts } from './functions/migrate-tips-to-posts'
import { syncLessonToSanity } from './functions/sanity/sync-lesson-to-sanity'
import { syncVideoResourceToSanity } from './functions/sanity/sync-video-resource-to-sanity'
import { syncPostToEgghead } from './functions/sync-post-to-egghead'

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
	],
}
