import { inngest } from '@/inngest/inngest.server'
import { getServerAuthSession } from '@/server/auth'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { z } from 'zod'

import { VIDEO_UPLOADED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-uploaded'

const f = createUploadthing()

export const ourFileRouter = {
	videoUploader: f({ video: { maxFileSize: '16GB', maxFileCount: 5 } })
		.input(
			z.object({
				parentResourceId: z.string().optional(),
			}),
		)
		.middleware(async ({ req, input }) => {
			const { session, ability } = await getServerAuthSession()

			console.log({ input })

			if (!session?.user || !ability.can('create', 'Content')) {
				throw new Error('Unauthorized')
			}

			return {
				user: session.user,
				userId: session.user.id,
				...(input?.parentResourceId && {
					parentResourceId: input.parentResourceId,
				}),
			}
		})
		.onUploadComplete(async (opts) => {
			console.debug('Upload complete for userId:', opts.metadata.userId)
			console.debug('file url', opts)
			await inngest.send({
				name: VIDEO_UPLOADED_EVENT,
				data: {
					originalMediaUrl: opts.file.url,
					fileName: opts.file.name || 'untitled',
					title: opts.file.name || 'untitled',
					parentResourceId: opts.metadata.parentResourceId,
					fileKey: opts.file.key,
				},
				user: opts.metadata.user,
			})
			return {
				uploadedByUserId: opts.metadata.userId,
			}
		}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
