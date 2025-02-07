import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ request }) => {
	const url = new URL(request.url)
	const collection = url.searchParams.get('collection')

	return new Response(
		JSON.stringify({ url: request.url, collection }, null, 2),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		},
	)
}
