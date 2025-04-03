import { env } from '@/env.mjs'
import { log } from '@/server/logger'
import { SkillRequest, withSkill } from '@/server/with-skill'

import { getMuxOptions } from '@coursebuilder/core/lib/mux'

const baseUrl = 'https://api.mux.com'

/**
 * MUX Direct Upload Endpoint that returns a signed upload URL
 *
 * @param req
 */
export const POST = withSkill(async (req: SkillRequest) => {
	try {
		const response = await fetch(`${baseUrl}/video/v1/uploads`, {
			headers: {
				Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString('base64')}`,
				'Content-Type': 'application/json',
			},
			method: 'POST',
			body: JSON.stringify(getMuxOptions()),
		})
		const json = await response.json()
		return new Response(JSON.stringify(json.data), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	} catch (error) {
		log.error(`mux error`, { error })
		return new Response(JSON.stringify(error), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}
})
