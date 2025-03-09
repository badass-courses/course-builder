// SKIP ROUTE - temporary fix to bypass route that's causing build failures
export async function GET() {
	return new Response(
		JSON.stringify({
			message: 'TRPC route temporarily disabled due to build issues',
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		},
	)
}

export async function POST() {
	return new Response(
		JSON.stringify({
			message: 'TRPC route temporarily disabled due to build issues',
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		},
	)
}
