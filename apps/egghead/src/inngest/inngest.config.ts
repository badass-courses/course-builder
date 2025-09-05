import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

import { calendarSync } from './functions/calendar-sync'
import { instructorInviteCompleted } from './functions/instructor-invite-completed'
import { instructorInviteCreated } from './functions/instructor-invite-created'
import { migrateTipsToPosts } from './functions/migrate-tips-to-posts'
import { notifySlack } from './functions/notify-slack-for-post'
import { postEventPurchase } from './functions/post-event-purchase'
import { syncLessonToSanity } from './functions/sanity/sync-lesson-to-sanity'
import { syncVideoResourceToSanity } from './functions/sanity/sync-video-resource-to-sanity'
import { syncPostToEgghead } from './functions/sync-post-to-egghead'
import { syncPostsToEggheadLessons } from './functions/sync-posts-to-egghead-lessons'
import {
	videoResourceAttached,
	videoResourceDetached,
} from './functions/video-resource-attached'
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
		instructorInviteCreated,
		instructorInviteCompleted,
		videoResourceAttached,
		videoResourceDetached,
		calendarSync,
		postEventPurchase,
	],
}
