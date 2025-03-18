import { NextRequest, NextResponse } from 'next/server'
import { withSkill } from '@/server/with-skill'
import { ourFileRouter } from '@/uploadthing/core'
import { createRouteHandler } from 'uploadthing/next'

// Verify that required environment variables are set
if (!process.env.UPLOADTHING_SECRET || !process.env.UPLOADTHING_APP_ID) {
	console.error('ERROR: Missing required environment variables for UploadThing')
	console.error(
		'UPLOADTHING_SECRET and UPLOADTHING_APP_ID must be set in your environment',
	)
	console.error(
		'Get these values from your UploadThing dashboard at https://uploadthing.com/dashboard',
	)
}

// Create route handler with proper error logging
const handlers = createRouteHandler({
	router: ourFileRouter,
})

// Wrap handlers with try/catch for better error reporting
const wrappedGET = async (req: NextRequest) => {
	try {
		return await handlers.GET(req)
	} catch (error) {
		console.error('UploadThing GET error:', error)
		return NextResponse.json(
			{ error: 'Internal Server Error in upload handler' },
			{ status: 500 },
		)
	}
}

const wrappedPOST = async (req: NextRequest) => {
	try {
		return await handlers.POST(req)
	} catch (error) {
		console.error('UploadThing POST error:', error)
		return NextResponse.json(
			{ error: 'Internal Server Error in upload handler' },
			{ status: 500 },
		)
	}
}

export const GET = withSkill(wrappedGET)
export const POST = withSkill(wrappedPOST)
