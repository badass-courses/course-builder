export type Environment = 'production' | 'preview' | 'development' | 'test'

const isValidEnvironment = (env: string): env is Environment => {
	return ['production', 'preview', 'development', 'test'].includes(env)
}

// Helper to get current environment
export const getEnvironment = (): Environment => {
	// Handle test environment
	if (process.env.NODE_ENV === 'test') {
		return 'test'
	}

	// Use NODE_ENV for local development
	if (process.env.NODE_ENV === 'development') {
		return 'development'
	}

	// Use VERCEL_ENV for deployed environments
	const env = process.env.VERCEL_ENV || 'production'

	if (!isValidEnvironment(env)) {
		console.warn(`Invalid environment: ${env}, defaulting to production`)
		return 'production'
	}

	return env
}

// Helper to get environment-specific key
export const getEnvKey = (key: string): string => {
	const env = getEnvironment()
	return `${env}:${key}`
}
