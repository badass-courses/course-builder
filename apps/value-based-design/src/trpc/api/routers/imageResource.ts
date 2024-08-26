import { env } from 'process'
import {
	getAllImageResources,
	getAllImageResourcesForResource,
} from '@/lib/image-resource-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import slugify from '@sindresorhus/slugify'
import { TRPCError } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import cloudinary from 'cloudinary'
import { z } from 'zod'

export const imageResourceRouter = createTRPCRouter({
	getAll: publicProcedure.query(async () => {
		return getAllImageResources()
	}),
	getAllForResource: publicProcedure
		.input(
			z.object({
				resourceId: z.string(),
			}),
		)
		.query(async ({ input }) => {
			console.log({ input })

			return getAllImageResourcesForResource({
				resourceId: input.resourceId,
			})
		}),
	download: publicProcedure
		.input(
			z.object({
				resourceId: z.string(),
				lessonTitle: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const images = await getAllImageResourcesForResource({
				resourceId: input.resourceId,
			})

			const publicIds = images.map((image) => image.public_id)

			cloudinary.v2.config({
				cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
				api_key: env.CLOUDINARY_API_KEY,
				api_secret: env.CLOUDINARY_API_SECRET,
				secure: true,
			})

			if (publicIds.length > 0) {
				let url = cloudinary.v2.utils.download_zip_url({
					public_ids: publicIds,
				})
				const response = await fetch(url)

				if (!response.ok) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Failed to fetch zip file from Cloudinary',
					})
				}

				const buffer = await response.arrayBuffer()
				const base64 = Buffer.from(buffer).toString('base64')

				return {
					fileName: `${slugify(input.lessonTitle)}-downloads.zip`,
					data: base64,
				}
			}

			return new TRPCError({
				code: 'NOT_FOUND',
				message: 'No images found',
			})
		}),
})
