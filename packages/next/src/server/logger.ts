import { Axiom } from '@axiomhq/js'

type LogLevel = 'info' | 'error' | 'warn' | 'debug'

export interface LoggerConfig {
	/** Axiom API token */
	token: string
	/** Organization ID for Axiom */
	orgId: string
	/** Dataset name for logging */
	dataset: string
	/** Whether to log errors in development (default: true) */
	logErrorsInDev?: boolean
}

export interface Logger {
	write(
		level: LogLevel,
		event: string,
		data: Record<string, any>,
	): Promise<void>
	info(event: string, data: Record<string, any>): Promise<void>
	error(event: string, data: Record<string, any>): Promise<void>
	warn(event: string, data: Record<string, any>): Promise<void>
	debug(event: string, data: Record<string, any>): Promise<void>
	flush(): Promise<void>
}

/**
 * Creates a logger instance configured for a specific organization.
 *
 * @param config - Logger configuration
 * @returns Logger instance with typed methods
 *
 * @example
 * ```ts
 * import { createLogger } from '@coursebuilder/next/server'
 *
 * export const log = createLogger({
 *   token: process.env.AXIOM_TOKEN!,
 *   orgId: 'ai-hero',
 *   dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET!,
 * })
 * ```
 */
export function createLogger(config: LoggerConfig): Logger {
	const { token, orgId, dataset, logErrorsInDev = true } = config

	const axiom = new Axiom({
		token,
		orgId,
		onError: (err) => {
			if (logErrorsInDev && process.env.NODE_ENV === 'development') {
				console.error('Axiom logging error:', err)
			}
		},
	})

	return {
		async write(level: LogLevel, event: string, data: Record<string, any>) {
			try {
				await axiom.ingest(dataset, [
					{
						_time: new Date().toISOString(),
						level,
						event,
						...data,
					},
				])
			} catch (error) {
				// Error handling is done by onError callback
			}
		},

		async info(event: string, data: Record<string, any>) {
			return this.write('info', event, data)
		},

		async error(event: string, data: Record<string, any>) {
			return this.write('error', event, data)
		},

		async warn(event: string, data: Record<string, any>) {
			return this.write('warn', event, data)
		},

		async debug(event: string, data: Record<string, any>) {
			return this.write('debug', event, data)
		},

		async flush() {
			return axiom.flush()
		},
	}
}
