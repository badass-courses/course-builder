import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

import { migrateTipsToPosts } from './functions/migrate-tips-to-posts'
import { notifySlack } from './functions/notify-slack-for-post'
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
		notifySlack,
	],
}
