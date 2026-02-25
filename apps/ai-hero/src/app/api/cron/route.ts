import { headers } from 'next/headers'
import { log } from '@/server/logger'
import { withSkill } from '@/server/with-skill'

export const dynamic = 'force-dynamic'

const runCronRefresh = async () => {
	await headers()
	try {
		const response = await fetch(`${process.env.COURSEBUILDER_URL}/api/inngest`, {
			method: 'PUT',
		})

		await log.info('api.cron.refresh_inngest.completed', {
			status: response.status,
			ok: response.ok,
		})

		return new Response(null, {
			status: 200,
		})
	} catch (error) {
		await log.error('api.cron.refresh_inngest.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return new Response(null, {
			status: 500,
		})
	}
}

export const GET = withSkill(runCronRefresh)
