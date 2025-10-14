import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
	await headers()
	console.log(
		'refreshing inngest',
		await fetch(`${process.env.COURSEBUILDER_URL}/api/inngest`, {
			method: 'PUT',
		}),
	)
	return new Response(null, {
		status: 200,
	})
}
