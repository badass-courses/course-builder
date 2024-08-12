import { NextResponse, type NextRequest } from 'next/server'
import {
	OCR_WEBHOOK_EVENT,
	OcrWebhookEventSchema,
} from '@/inngest/events/ocr-webhook'
import { inngest } from '@/inngest/inngest.server'
import { withSkill } from '@/server/with-skill'

export const POST = withSkill(async (req: NextRequest) => {
	const ocrWebhookEvent = OcrWebhookEventSchema.parse(await req.json())

	console.info(
		`Received request for OCR from screenshot at ${ocrWebhookEvent.screenshotUrl}`,
	)

	await inngest.send({
		name: OCR_WEBHOOK_EVENT,
		data: {
			ocrWebhookEvent,
		},
	})

	return new Response('ok', {
		status: 200,
	})
})
