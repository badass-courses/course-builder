import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { cloudinary } from '@/utils/cloudinary'
import { z } from 'zod'

const clResourceSchema = z.object({
	secure_url: z.string(),
})

export const certificateRouter = createTRPCRouter({
	upload: publicProcedure
		.input(
			z.object({
				imagePath: z.string(),
				resourceIdOrSlug: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { session } = await getServerAuthSession()
			if (!session)
				return {
					error: 'Not authenticated',
				}

			const user = await courseBuilderAdapter.getUserById(
				session?.user?.id as string,
			)
			if (!user)
				return {
					error: 'User not found',
				}
			try {
				const res = await fetch(input.imagePath)
				if (!res.ok) {
					const errorData = await res.json()
					return {
						error: errorData.error || 'Failed to download certificate',
					}
				}
				return await uploadImage(
					input.imagePath,
					user.id,
					input.resourceIdOrSlug,
				)
			} catch {
				return { error: 'Something went wrong' }
			}
		}),
	get: publicProcedure
		.input(
			z.object({
				resourceIdOrSlug: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { session } = await getServerAuthSession()
			if (!session) return null
			const user = await courseBuilderAdapter.getUserById(
				session?.user?.id as string,
			)

			if (!user) return null

			try {
				const cert = await cloudinary.api.resource(
					`certificate/${user.id}/${input.resourceIdOrSlug}`,
				)

				if (!cert) return null

				const parsedCert = clResourceSchema.parse(cert)
				return parsedCert
			} catch {
				return null
			}
		}),
})

const uploadImage = async (
	imagePath: string,
	userId: string,
	resourceIdOrSlug: string,
) => {
	const options = {
		public_id: `certificate/${userId}/${resourceIdOrSlug}`,
		unique_filename: true,
		use_filename: true,
		overwrite: true,
		filename_override: true,
	}

	try {
		const result = await cloudinary.uploader.upload(imagePath, options)
		console.log(result)
		return result
	} catch (error) {
		console.error(error)
	}
}
