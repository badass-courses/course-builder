import { NextRequest, NextResponse } from 'next/server'
import { subscribeToNewsletter } from '@/lib/subscribe-actions'

export async function POST(req: NextRequest) {
	const contentLength = req.headers.get('content-length')
	if (contentLength && parseInt(contentLength) > 1024) {
		return NextResponse.json({ error: 'Request too large' }, { status: 413 })
	}

	try {
		const body = await req.json()
		const result = await subscribeToNewsletter({
			email: body.email,
			firstName: body.firstName,
		})

		if (result.success) {
			return NextResponse.json(result)
		}

		const status = result.error.includes('Too many attempts') ? 429 : 400

		return NextResponse.json({ error: result.error }, { status })
	} catch {
		return NextResponse.json(
			{ error: 'Invalid request body' },
			{ status: 400 },
		)
	}
}
