import { CourseBuilderConfig } from '../../index'
import { Provider } from '../../providers'
import { InternalProvider } from '../../types'
import { merge } from './merge'

export default function parseProviders(params: {
	providers: Provider[]
	url: URL
	providerId?: string
	options: CourseBuilderConfig
}): {
	providers: InternalProvider[]
	provider?: InternalProvider
} {
	const { providerId, options } = params

	const providers = params.providers.map((p) => {
		const provider = typeof p === 'function' ? p() : p
		const { options: userOptions, ...defaults } = provider

		if (!userOptions) {
			throw new Error(`Provider ${provider.id} is missing options`)
		}

		const { paymentsAdapter, ...userOptionsWithPaymentsAdapter } = userOptions

		return {
			...merge(defaults, userOptionsWithPaymentsAdapter),
			...(paymentsAdapter ? { options: paymentsAdapter } : {}),
		}
	})

	return {
		providers,
		provider: providers.find(({ id }) => id === providerId),
	}
}
