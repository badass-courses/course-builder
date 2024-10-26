import { NextRequest, NextResponse } from 'next/server'
import { getVideoResource } from '@/lib/video-resource-query'
import { getUserAbilityForRequest } from '@/server/ability-for-request'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(
	request: NextRequest,
	{ params }: { params: { videoResourceId: string } },
) {
	const { ability, user } = await getUserAbilityForRequest(request)

	if (params.videoResourceId) {
		const videoResource = await getVideoResource(params.videoResourceId)

		if (!videoResource) {
			return NextResponse.json(
				{ error: 'videoResource not found' },
				{
					status: 404,
					headers: corsHeaders,
				},
			)
		}
		if (ability.can('create', 'Content')) {
			return NextResponse.json(videoResource, {
				headers: corsHeaders,
			})
		}

		return NextResponse.json(
			{ error: 'Unauthorized' },
			{
				status: 401,
				headers: corsHeaders,
			},
		)
	}

	return NextResponse.json({}, { headers: corsHeaders })
}
