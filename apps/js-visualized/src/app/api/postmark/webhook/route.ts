import { type NextRequest, type NextResponse } from 'next/server'
import { env } from '@/env.mjs'
import { POSTMARK_WEBHOOK_EVENT } from '@/inngest/events/postmark-webhook'
import { inngest } from '@/inngest/inngest.server'
import { withSkill } from '@/server/with-skill'

export const POST = withSkill(async (req: NextRequest, res: NextResponse) => {
	const body = await req.json()

	if (req.headers.get('course-builder') !== env.POSTMARK_WEBHOOK_SECRET) {
		return new Response('ok', {
			status: 200,
		})
	}

	await inngest.send({
		name: POSTMARK_WEBHOOK_EVENT,
		data: {
			...body,
		},
	})

	return new Response('ok', {
		status: 200,
	})
})
