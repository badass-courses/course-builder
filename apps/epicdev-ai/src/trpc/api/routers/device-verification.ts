import { db } from '@/db'
import { deviceVerifications } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { isAfter } from 'date-fns'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '../trpc'

export const deviceVerificationRouter = createTRPCRouter({
	verify: publicProcedure
		.input(
			z.object({
				userCode: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { session } = await getServerAuthSession()

			console.log({ session })

			if (session) {
				const deviceVerification = await db.query.deviceVerifications.findFirst(
					{
						where: eq(deviceVerifications.userCode, input.userCode),
					},
				)

				console.log({ deviceVerification })

				if (deviceVerification) {
					if (deviceVerification.verifiedAt) {
						return { status: 'already-verified' }
					}

					if (isAfter(new Date(), deviceVerification.expires)) {
						return { status: 'code-expired' }
					}

					if (!session.user) {
						return { status: 'login-required' }
					}

					await db
						.update(deviceVerifications)
						.set({
							verifiedAt: new Date(),
							verifiedByUserId: session.user.id,
						})
						.where(
							eq(deviceVerifications.deviceCode, deviceVerification.deviceCode),
						)

					return { status: 'device-verified' }
				} else {
					return { status: 'no-verification-found' }
				}
			} else {
				return { status: 'login-required' }
			}
		}),
})
