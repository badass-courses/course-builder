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

	const data = await request.formData()
	const price = data.get('priceId') as string
	const customer = data.get('customerId') as string

	if (!price) {
		// TODO what's the right HTTP code here?
		return new Response(null, {
			status: 404,
			statusText: 'Not found',
		})
	}

	const url = new URL(request.url)
	url.pathname = '/dashboard'

	const options: Stripe.Checkout.SessionCreateParams = {
		success_url: url.toString(),
		line_items: [{ price, quantity: 1 }],
		metadata: { userId },
		mode: 'subscription',
	}

	if (customer && customer.startsWith('cus_')) {
		options.customer = customer
	}

	const session = await stripe.checkout.sessions.create(options)

	return new Response(null, {
		status: 301,
		headers: {
			location: session.url!,
		},
	})
}
