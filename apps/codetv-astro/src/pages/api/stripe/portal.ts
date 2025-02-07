import { type APIRoute } from 'astro'
import { STRIPE_SECRET_KEY } from 'astro:env/server'
import Stripe from 'stripe'

const stripe = new Stripe(STRIPE_SECRET_KEY)

export const POST: APIRoute = async ({ request, locals }) => {
	const userId = locals.auth().userId

	if (!userId) {
		return new Response(null, {
			status: 401,
			statusText: 'Not authorized',
		})
	}

	const url = new URL(request.url)
	url.pathname = '/dashboard'

	const data = await request.formData()
	const customer = data.get('customerId') as string

	if (!customer) {
		return new Response(null, {
			status: 401,
			statusText: 'unauthorized',
		})
	}

	const session = await stripe.billingPortal.sessions.create({
		customer,
		return_url: url.toString(),
	})

	return new Response(null, {
		status: 301,
		headers: {
			location: session.url!,
		},
	})
}
