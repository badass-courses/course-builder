import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResourceResource } from '@/db/schema'
import { EmailSchema, NewEmailSchema } from '@/lib/emails'
import { createEmail, getEmail, getEmails } from '@/lib/emails-query'
import { addResourceToWorkshop } from '@/lib/workshops-query'
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export const emailsRouter = createTRPCRouter({
	getEmails: publicProcedure.query(async () => {
		return await getEmails()
	}),

	createEmail: protectedProcedure
		.input(NewEmailSchema)
		.mutation(async ({ input }) => {
			const email = await createEmail(input)
			revalidateTag('emails', 'max')
			return email
		}),

	getEmail: publicProcedure.input(z.string()).query(async ({ input }) => {
		return await getEmail(input)
	}),

	addEmailToWorkshop: protectedProcedure
		.input(
			z.object({
				workshopId: z.string(),
				emailId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const email = await getEmail(input.emailId)
			if (!email) {
				throw new Error('Email not found')
			}

			const result = await addResourceToWorkshop({
				resource: email,
				workshopId: input.workshopId,
			})

			revalidateTag('workshop', 'max')
			revalidateTag('workshops', 'max')
			revalidateTag(input.workshopId, 'max')

			return result
		}),

	removeEmailFromWorkshop: protectedProcedure
		.input(
			z.object({
				workshopId: z.string(),
				emailId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const result = await db
				.delete(contentResourceResource)
				.where(
					and(
						eq(contentResourceResource.resourceOfId, input.workshopId),
						eq(contentResourceResource.resourceId, input.emailId),
					),
				)

			revalidateTag('workshop', 'max')
			revalidateTag('workshops', 'max')
			revalidateTag(input.workshopId, 'max')

			return result
		}),
})
