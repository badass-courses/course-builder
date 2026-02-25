// ./app/api/chat/route.js
import { redis } from '@/server/redis-client'
import { withSkill } from '@/server/with-skill'
import { openai } from '@ai-sdk/openai'
import { Ratelimit } from '@upstash/ratelimit'
import { streamText } from 'ai'

export const POST = withSkill(async (req: Request) => {
	// Use a constant string to limit all requests with a single ratelimit
	// Or use a userID, apiKey or ip address for individual limits.
	const ip = req.headers.get('x-forwarded-for')
	const ratelimit = new Ratelimit({
		redis,
		// rate limit to 5 requests per 10 seconds
		limiter: Ratelimit.slidingWindow(5, '10s'),
	})

	const { success, limit, reset, remaining } = await ratelimit.limit(
		`ratelimit_${ip}`,
	)

	if (!success) {
		return new Response('You have reached your request limit for the day.', {
			status: 429,
			headers: {
				'X-RateLimit-Limit': limit.toString(),
				'X-RateLimit-Remaining': remaining.toString(),
				'X-RateLimit-Reset': reset.toString(),
			},
		})
	}

	const { messages } = await req.json()

	const result = streamText({
		model: openai('gpt-4o'),
		messages,
	})

	return result.toDataStreamResponse()
})
