import { z } from 'zod'

export const OCR_WEBHOOK_EVENT = 'ocr/web-hook-event'

export type OcrWebhook = {
	name: typeof OCR_WEBHOOK_EVENT
	data: {
		ocrWebhookEvent: OcrWebhookEvent
	}
}

export const OcrWebhookEventSchema = z.object({
	screenshotUrl: z.string().nullable(),
	resourceId: z.string().nullable().optional(),
})

export type OcrWebhookEvent = z.infer<typeof OcrWebhookEventSchema>
