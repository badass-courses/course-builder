import { env } from '@/env.mjs'
import { OCR_WEBHOOK_EVENT } from '@/inngest/events/ocr-webhook'
import { inngest } from '@/inngest/inngest.server'
import { extractCodeFromScreenshot } from '@/transcript-processing/extract-code-from-screenshot'
import { NonRetriableError } from 'inngest'

export const performCodeExtraction = inngest.createFunction(
	{
		id: `perform_code_extraction`,
		name: 'Perform Code Extraction',
	},
	{
		event: OCR_WEBHOOK_EVENT,
	},
	async ({ event, step, partyProvider }) => {
		const screenshotUrl = event.data.ocrWebhookEvent.screenshotUrl as string
		const resourceId = event.data.ocrWebhookEvent.resourceId as string

		const extractedCode = await step.run(
			'extract code from screenshot',
			async () => {
				return extractCodeFromScreenshot(screenshotUrl)
					.then((codeString) => {
						return {
							codeString,
						}
					})
					.catch((e) => {
						console.error(e)
						throw new NonRetriableError('Error extracting code from screenshot')
					})
			},
		)

		await step.run(`partykit broadcast [${resourceId}]`, async () => {
			return await partyProvider.broadcastMessage({
				body: {
					body: {
						content: extractedCode.codeString,
						role: 'assistant',
					},
					requestId: resourceId,
					name: 'code.extraction.completed',
				},
				roomId: resourceId,
			})
		})

		return extractedCode.codeString
	},
)
