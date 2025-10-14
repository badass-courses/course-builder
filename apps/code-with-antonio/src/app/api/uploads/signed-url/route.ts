import { NextRequest, NextResponse } from 'next/server'
import { getSignedUrlForVideoFile } from '@/video-uploader/get-signed-s3-url'

export const GET = async (request: NextRequest) => {
	const searchParams = new URL(request.url).searchParams
	const filename = searchParams.get('objectName')

	if (filename) {
		const signedUrl = await getSignedUrlForVideoFile({ filename })
		return NextResponse.json(signedUrl, {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		})
	}

	return NextResponse.json(
		{ error: 'No filename provided' },
		{
			status: 400,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		},
	)
}
