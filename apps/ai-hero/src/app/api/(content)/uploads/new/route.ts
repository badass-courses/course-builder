import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/inngest/inngest.server'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { withSkill } from '@/server/with-skill'
import { z } from 'zod'

import { VIDEO_UPLOADED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-uploaded'

// Zod schema for the request body
const UploadBodySchema = z.object({
	file: z.object({
		url: z.string().url(),
		name: z.string().optional(),
	}),
	metadata: z.object({
		parentResourceId: z.string(),
	}),
})

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export const OPTIONS = async () => {
	return NextResponse.json({}, { headers: corsHeaders })
}

export const POST = withSkill(async (request: NextRequest) => {
	const { user, ability } = await getUserAbilityForRequest(request)

	if (ability.cannot('create', 'Content')) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	try {
		const body = await request.json()

		// Validate the request body
		const validatedBody = UploadBodySchema.parse(body)

		await inngest.send({
			name: VIDEO_UPLOADED_EVENT,
			data: {
				originalMediaUrl: validatedBody.file.url,
				fileName: validatedBody.file.name || 'untitled',
				title: validatedBody.file.name || 'untitled',
				parentResourceId: validatedBody.metadata.parentResourceId,
			},
			user,
		})

		return NextResponse.json({ success: true }, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors },
				{ status: 400, headers: corsHeaders },
			)
		}
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500, headers: corsHeaders },
		)
	}
})
