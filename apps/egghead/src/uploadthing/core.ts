import { inngest } from '@/inngest/inngest.server'
import { getServerAuthSession } from '@/server/auth'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { z } from 'zod'

import { VIDEO_UPLOADED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-uploaded'

const f = createUploadthing()

export const ourFileRouter = {
	videoUploader: f({ video: { maxFileSize: '8GB', maxFileCount: 5 } })
		.input(
			z.object({
				parentResourceId: z.string().optional(),
			}),
		)
		.middleware(async ({ req, input }) => {
			try {
				const { session, ability } = await getServerAuthSession()

				if (!session?.user) {
					console.error('UploadThing error: No user in session')
					throw new Error('Unauthorized - No user in session')
				}

				if (!ability.can('create', 'Content')) {
					console.error('UploadThing error: User lacks permission', {
						userId: session.user.id,
					})
					throw new Error('Unauthorized - Insufficient permissions')
				}

				console.log('UploadThing middleware: User authorized', {
					userId: session.user.id,
					parentResourceId: input?.parentResourceId,
				})

				return {
					user: session.user,
					userId: session.user.id,
					...(input?.parentResourceId && {
						parentResourceId: input.parentResourceId,
					}),
				}
			} catch (error) {
				console.error('UploadThing middleware error:', error)
				throw error
			}
		})
		.onUploadComplete(async (opts) => {
			try {
				console.log('Upload complete for userId:', opts.metadata.userId)
				console.log('File details:', {
					url: opts.file.url,
					name: opts.file.name,
					size: opts.file.size,
					key: opts.file.key,
				})

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

				console.log('Successfully sent event to Inngest')
			} catch (error) {
				console.error('Error in onUploadComplete:', error)
				// Don't throw here to prevent the client from receiving an error
				// after the upload is already complete
			}
		}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
