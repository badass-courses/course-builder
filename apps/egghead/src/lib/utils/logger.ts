/**
 * Simple logger utility that respects LOG_LEVEL environment variable
 *
 * @example
 * ```ts
 * logger.info('Fetching posts', { limit: 50, offset: 0 })
 * logger.error('Failed to fetch posts', error)
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
}

const getCurrentLogLevel = (): number => {
	const level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
	return LOG_LEVELS[level] ?? LOG_LEVELS.info
}

const shouldLog = (level: LogLevel): boolean => {
	return LOG_LEVELS[level] >= getCurrentLogLevel()
}

const formatMessage = (
	level: LogLevel,
	message: string,
	data?: any,
): string => {
	const timestamp = new Date().toISOString()
	const levelStr = level.toUpperCase()

	if (data) {
		return `[${timestamp}] ${levelStr}: ${message} - ${JSON.stringify(data)}`
	}

	return `[${timestamp}] ${levelStr}: ${message}`
}

export const logger = {
	debug: (message: string, data?: any) => {
		if (shouldLog('debug')) {
			console.debug(formatMessage('debug', message, data))
		}
	},
	info: (message: string, data?: any) => {
		if (shouldLog('info')) {
			console.info(formatMessage('info', message, data))
		}
	},
	warn: (message: string, data?: any) => {
		if (shouldLog('warn')) {
			console.warn(formatMessage('warn', message, data))
		}
	},
	error: (message: string, data?: any) => {
		if (shouldLog('error')) {
			console.error(formatMessage('error', message, data))
		}
	},
}
