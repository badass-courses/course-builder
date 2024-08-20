import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { Cookie } from '../utils/cookie'

export async function userLookup(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	if (!options.adapter) throw new Error('Adapter not found')
	if (request.headers?.['x-skill-secret'] !== process.env.SKILL_SECRET) {
		return { status: 401, body: 'unauthorized' }
	}

	try {
		const email =
			(request.query?.email as string) || (request.body?.email as string)

		const user = await options.adapter.getUserWithPurchasersByEmail(email)
		return {
			status: 200,
			body: JSON.stringify(user),
		}
	} catch (e) {
		console.log('error', e)
		throw new Error('unable-to-lookup-user')
	}
}
