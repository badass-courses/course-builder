import { env } from '@/env.mjs'

export async function getFormSubscribers() {
	try {
		const response = await fetch(
			`https://api.convertkit.com/v4/forms/${env.CONVERTKIT_SIGNUP_FORM}/subscribers?include_total_count=include_total_count&per_page=1&status=active`,
			{
				headers: {
					'X-Kit-Api-Key': process.env.CONVERTKIT_V4_API_KEY!,
				},
			},
		)

		const data = await response.json()
		console.log(data)

		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
		const subscribersWithinLastWeek = await fetch(
			`https://api.convertkit.com/v4/forms/${env.CONVERTKIT_SIGNUP_FORM}/subscribers?include_total_count=include_total_count&per_page=1&created_after=${sevenDaysAgo.toISOString()}`,
			{
				headers: {
					'X-Kit-Api-Key': process.env.CONVERTKIT_V4_API_KEY!,
				},
			},
		)
		const subscribersWithinLastWeekData = await subscribersWithinLastWeek.json()
		console.log(subscribersWithinLastWeekData)

		return {
			...data,
			total_count: data.pagination.total_count,
			subscribers_added_last_week:
				subscribersWithinLastWeekData.pagination.total_count,
		}
	} catch (error) {
		console.error(error)
		return []
	}
}
