import { NodemailerConfig } from '@auth/core/providers/nodemailer'

import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { createVerificationUrl } from '../send-server-email'
import { Cookie } from '../utils/cookie'

export async function createMagicLink(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	if (!options.adapter) throw new Error('Adapter not found')
	if (request.headers?.['x-skill-secret'] !== process.env.SKILL_SECRET) {
		return { status: 401, body: 'unauthorized' }
	}

	const { email } = request.body || {}

	if (!email) {
		return { status: 400, body: 'email is required' }
	}

	const emailProvider = options.providers.find((p) => p.type === 'email')

	if (!emailProvider) {
		return { status: 400, body: 'email provider not found' }
	}

	const expiresIn = request.body?.expiresIn || request.query?.expiresIn

	let expiresAt: Date | undefined = undefined

	if (expiresIn) {
		const durationInMilliseconds = expiresIn * 1000
		expiresAt = new Date(Date.now() + durationInMilliseconds)
	}

	try {
		const verificationDetails = await createVerificationUrl({
			email,
			emailProvider: emailProvider as NodemailerConfig,
			authOptions: options.authConfig,
			adapter: options.adapter,
			baseUrl: options.baseUrl,
			expiresAt,
		})
		if (!verificationDetails?.url) {
			return {
				status: 500,
				body: JSON.stringify({
					error: 'Could not create verification url',
				}),
			}
		}
		return {
			status: 200,
			body: JSON.stringify({
				url: verificationDetails.url,
			}),
		}
	} catch (e) {
		console.log('error', e)
		return {
			status: 500,
			body: JSON.stringify({ error: (e as Error).message }),
		}
	}
}
