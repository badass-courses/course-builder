import { db } from '@/db'
import { entitlements } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'

import { UPDATE_ENTITLEMENTS_CRASH_COURSE_EVENT } from '../events/update-entitlements-crash-course'

type Purchase = {
	id: string
	userId: string
	productId: string
	createdAt: Date
	purchaseId: string
	organizationId: string
	organizationMembershipId: string
}

export const updateCrashCourseEntitlements = inngest.createFunction(
	{
		id: 'update-crash-course-entitlements',
		name: 'Update Crash Course Entitlements',
	},
	{
		event: UPDATE_ENTITLEMENTS_CRASH_COURSE_EVENT,
	},
	async ({ event, step }) => {
		await log.info('update_crash_course_entitlements.start', {})

		const loadEligiblePurchases = await step.run('load-purchases', async () => {
			const { sql } = await import('drizzle-orm')
			const query = sql`
                    SELECT DISTINCT
                    p.userId,
                    p.id AS purchaseId,
					p.organizationId,
					om.id AS organizationMembershipId
                    FROM AI_Purchase AS p
                    INNER JOIN AI_OrganizationMembership AS om
                    ON om.userId = p.userId
                    WHERE
                    p.productId = 'product-wdhub'
                    AND p.status != 'Refunded'
                    AND NOT EXISTS (
                        SELECT 1
                        FROM AI_Entitlement AS e
                        WHERE
                        e.userId = p.userId
                        AND e.deletedAt IS NULL
                        AND JSON_CONTAINS(
                            JSON_EXTRACT(e.metadata, '$.contentIds'),
                            JSON_QUOTE('workshop-xoh13')
                        )
                    )
			`
			const result = await db.execute(query)
			const purchases = result.rows as Purchase[]

			return purchases
		})

		const updateEntitlements = await Promise.all(
			loadEligiblePurchases.map((purchase) =>
				step.run(`update-entitlements-${purchase.purchaseId}`, async () => {
					await db.insert(entitlements).values({
						id: crypto.randomUUID(),
						entitlementType: 'et_01K5X6XPCN7HQXEE8CYRE25G08',
						userId: purchase.userId,
						sourceId: purchase.purchaseId,
						organizationId: purchase.organizationId,
						organizationMembershipId: purchase.organizationMembershipId,
						sourceType: 'PURCHASE',
						metadata: {
							contentIds: ['workshop-xoh13'],
						},
					})

					return { purchaseId: purchase.purchaseId, userId: purchase.userId }
				}),
			),
		)

		return { message: 'Update crash course entitlements completed' }
	},
)
