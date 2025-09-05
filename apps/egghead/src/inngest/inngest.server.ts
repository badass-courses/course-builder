import { slackProvider } from '@/coursebuilder/slack-provider'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import {
	IMAGE_RESOURCE_CREATED_EVENT,
	ImageResourceCreated,
} from '@/inngest/events/image-resource-created'
import {
	RESOURCE_CREATED_EVENT,
	ResourceCreated,
} from '@/inngest/events/resource-management'
import { USER_CREATED_EVENT, UserCreated } from '@/inngest/events/user-created'
import {
	VIDEO_ATTACHED_EVENT,
	VIDEO_DETACHED_EVENT,
	VideoAttached,
	VideoDetached,
} from '@/inngest/events/video-attachment'
import { authOptions } from '@/server/auth'
import { EventSchemas, Inngest } from 'inngest'
import { UTApi } from 'uploadthing/server'

import { CourseBuilderCoreEvents } from '@coursebuilder/core/inngest'
import {
	RESOURCE_CHAT_REQUEST_EVENT,
	ResourceChat,
} from '@coursebuilder/core/inngest/co-gardener/resource-chat'
import { createInngestMiddleware } from '@coursebuilder/core/inngest/create-inngest-middleware'
import DeepgramProvider from '@coursebuilder/core/providers/deepgram'
import OpenAIProvider from '@coursebuilder/core/providers/openai'
import PartykitProvider from '@coursebuilder/core/providers/partykit'

import {
	EGGHEAD_COURSE_CREATED_EVENT,
	EggheadCourseCreated,
} from './events/egghead/course-created'
import {
	EGGHEAD_LESSON_CREATED_EVENT,
	EggheadLessonCreated,
} from './events/egghead/lesson-created'
import {
	INSTRUCTOR_INVITE_COMPLETED_EVENT,
	InstructorInviteCompleted,
} from './events/instructor-invite-completed'
import {
	INSTRUCTOR_INVITE_CREATED_EVENT,
	InstructorInviteCreated,
} from './events/instructor-invite-created'
import { POST_CREATED_EVENT, PostCreated } from './events/post-created'
import {
	TIPS_UPDATED_EVENT,
	TipsUpdated,
} from './functions/migrate-tips-to-posts'
import {
	POST_UPDATED_EVENT,
	PostUpdated,
} from './functions/sync-post-to-egghead'
import {
	SYNC_POSTS_TO_EGGHEAD_LESSONS_EVENT,
	SyncPostsToEggheadLessonsEvent,
} from './functions/sync-posts-to-egghead-lessons'

// Create a client to send and receive events
export type Events = {
	[IMAGE_RESOURCE_CREATED_EVENT]: ImageResourceCreated
	[RESOURCE_CHAT_REQUEST_EVENT]: ResourceChat
	[USER_CREATED_EVENT]: UserCreated
	[POST_UPDATED_EVENT]: PostUpdated
	[TIPS_UPDATED_EVENT]: TipsUpdated
	[EGGHEAD_LESSON_CREATED_EVENT]: EggheadLessonCreated
	[POST_CREATED_EVENT]: PostCreated
	[SYNC_POSTS_TO_EGGHEAD_LESSONS_EVENT]: SyncPostsToEggheadLessonsEvent
	[INSTRUCTOR_INVITE_CREATED_EVENT]: InstructorInviteCreated
	[INSTRUCTOR_INVITE_COMPLETED_EVENT]: InstructorInviteCompleted
	[EGGHEAD_COURSE_CREATED_EVENT]: EggheadCourseCreated
	[VIDEO_ATTACHED_EVENT]: VideoAttached
	[VIDEO_DETACHED_EVENT]: VideoDetached
	[RESOURCE_CREATED_EVENT]: ResourceCreated
}

const callbackBase =
	env.NODE_ENV === 'production' ? env.UPLOADTHING_URL : env.NEXT_PUBLIC_URL

const middleware = createInngestMiddleware({
	db: courseBuilderAdapter,
	siteRootUrl: env.NEXT_PUBLIC_URL,
	mediaUploadProvider: new UTApi(),
	openaiProvider: OpenAIProvider({
		apiKey: env.OPENAI_API_KEY,
		partyUrlBase: env.NEXT_PUBLIC_PARTY_KIT_URL,
	}),
	partyProvider: PartykitProvider({
		partyUrlBase: env.NEXT_PUBLIC_PARTY_KIT_URL,
	}),
	transcriptProvider: DeepgramProvider({
		apiKey: env.DEEPGRAM_API_KEY,
		callbackUrl: `${callbackBase}/api/coursebuilder/webhook/deepgram`,
	}),
	notificationProvider: slackProvider,
	getAuthConfig: () => authOptions,
})

export const inngest = new Inngest({
	id: env.INNGEST_APP_NAME,
	middleware: [middleware],
	schemas: new EventSchemas().fromRecord<Events & CourseBuilderCoreEvents>(),
})
