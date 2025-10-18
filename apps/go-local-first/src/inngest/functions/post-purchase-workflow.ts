import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { sendAnEmail } from '@/utils/send-an-email'
import { Liquid } from 'liquidjs'

import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

export const postPurchaseWorkflow = inngest.createFunction(
	{
		id: `post-purchase-workflow`,
		name: `Post-Purchase Followup Workflow`,
		idempotency: 'event.data.checkoutSessionId',
	},
	{
		event: NEW_PURCHASE_CREATED_EVENT,
	},
	async ({ event, step, db }) => {
		const purchase = await step.run(`get purchase`, async () => {
			return db.getPurchase(event.data.purchaseId)
		})

		if (!purchase) {
			throw new Error(`purchase not found`)
		}

		const user = await step.run(`get user`, async () => {
			return db.getUserById(purchase.userId as string)
		})

		if (!user) {
			throw new Error(`user not found`)
		}

		const emailResource = await step.run(`get email resource`, async () => {
			const emailResourceId = 'email-yv1pd'
			return db.getContentResource(emailResourceId)
		})

		if (!emailResource) {
			throw new Error(`email resource not found`)
		}

		await step.sleep(`sleep for 5 minutes`, '15m')

		const welcomeEmailBody: string = await step.run(
			`parse email body`,
			async () => {
				try {
					const engine = new Liquid()
					return engine.parseAndRender(emailResource.fields?.body, {
						user: event.user,
						invoiceUrl: `${env.COURSEBUILDER_URL}/invoices/${purchase.merchantChargeId}`,
					})
				} catch (e: any) {
					console.error(e.message)
					return emailResource.fields?.body
				}
			},
		)

		const sendWelcomeEmailResponse = await step.run(
			'send welcome email',
			async () => {
				return await sendAnEmail({
					Component: BasicEmail,
					componentProps: {
						body: welcomeEmailBody,
						preview: 'get the most out of your course',
						messageType: 'transactional',
					},
					Subject: `Get Started with ${env.NEXT_PUBLIC_SITE_TITLE}`,
					To: event.user.email,
					type: 'transactional',
				})
			},
		)

		return sendWelcomeEmailResponse
	},
)
