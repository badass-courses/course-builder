/**
 * Robust Axiom logger with graceful degradation
 *
 * Features:
 * - Graceful fallback to console when Axiom credentials are missing
 * - Batched log ingestion with configurable flush interval
 * - Log level filtering based on environment
 * - Request context propagation via AsyncLocalStorage
 * - Proper error serialization preserving stack traces
 * - Shutdown handler for process exit
 * - Backward-compatible API (log.info, log.error, log.warn, log.debug)
 *
 * @module logger
 */

import { AsyncLocalStorage } from 'async_hooks'
import { env } from '@/env.mjs'

import type { LogContext, LogEntry, LogLevel } from './logger-types'
import { serializeError } from './logger-utils'

// Re-export utilities for consumers
export { serializeError } from './logger-utils'
export type {
	LogContext,
	LogEntry,
	LogLevel,
	SerializedError,
} from './logger-types'

/**
 * AsyncLocalStorage for request context propagation
 * Allows automatic context injection across async boundaries
 */
const contextStorage = new AsyncLocalStorage<LogContext>()

/**
 * Log level priority for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
}

/**
 * Get minimum log level from environment
 */
function getMinLevel(): LogLevel {
	const level = env.LOG_LEVEL as LogLevel | undefined
	if (level && level in LOG_LEVEL_PRIORITY) {
		return level
	}
	// Default: debug in development, info in production
	return env.NODE_ENV === 'development' ? 'debug' : 'info'
}

/**
 * Check if Axiom is properly configured
 */
function isAxiomConfigured(): boolean {
	return Boolean(process.env.AXIOM_TOKEN && env.NEXT_PUBLIC_AXIOM_DATASET)
}

/**
 * Lazy-initialized Axiom client
 * Only created when actually needed and credentials are available
 */
let axiomClient: import('@axiomhq/js').Axiom | null = null

async function getAxiomClient(): Promise<import('@axiomhq/js').Axiom | null> {
	if (!isAxiomConfigured()) {
		return null
	}

	if (!axiomClient) {
		const { Axiom } = await import('@axiomhq/js')
		axiomClient = new Axiom({
			token: process.env.AXIOM_TOKEN!,
			orgId: env.AXIOM_ORG_ID || 'ai-hero',
			onError: (err) => {
				// Always log Axiom errors to console for visibility
				console.error('[Logger] Axiom error:', err)
			},
		})
	}

	return axiomClient
}

/**
 * Format log entry for console output
 */
function formatConsoleLog(entry: LogEntry): string {
	const { _time, level, event, context, ...data } = entry
	const contextStr = context?.requestId ? ` [${context.requestId}]` : ''
	const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : ''
	return `[${level.toUpperCase()}]${contextStr} ${event}${dataStr}`
}

/**
 * Log to console with appropriate method
 */
function logToConsole(level: LogLevel, entry: LogEntry): void {
	const message = formatConsoleLog(entry)
	switch (level) {
		case 'debug':
			console.debug(message)
			break
		case 'info':
			console.info(message)
			break
		case 'warn':
			console.warn(message)
			break
		case 'error':
			console.error(message)
			break
	}
}

/**
 * Batching state for log entries
 */
let logBuffer: LogEntry[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
const FLUSH_INTERVAL = 5000 // 5 seconds
const MAX_BATCH_SIZE = 100

/**
 * Schedule a flush if not already scheduled
 */
function scheduleFlush(): void {
	if (!flushTimer) {
		flushTimer = setTimeout(() => {
			flushTimer = null
			void flushLogs()
		}, FLUSH_INTERVAL)
	}
}

/**
 * Flush all buffered logs to Axiom
 */
async function flushLogs(): Promise<void> {
	if (logBuffer.length === 0) return

	const entries = logBuffer
	logBuffer = []

	const client = await getAxiomClient()
	if (!client) {
		// Already logged to console during write, nothing more to do
		return
	}

	try {
		await client.ingest(env.NEXT_PUBLIC_AXIOM_DATASET!, entries)
	} catch (error) {
		console.error('[Logger] Failed to flush logs to Axiom:', error)
		// Don't re-buffer failed entries to avoid infinite loops
	}
}

/**
 * Core write function
 */
async function write(
	level: LogLevel,
	event: string,
	data: Record<string, unknown>,
): Promise<void> {
	// Check log level filter
	const minLevel = getMinLevel()
	if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLevel]) {
		return
	}

	// Get context from AsyncLocalStorage
	const context = contextStorage.getStore()

	// Build log entry
	const entry: LogEntry = {
		_time: new Date().toISOString(),
		level,
		event,
		...(context && { context }),
		...data,
	}

	// Always log to console in development
	if (env.NODE_ENV === 'development') {
		logToConsole(level, entry)
	}

	// If Axiom is not configured, we're done (already logged to console)
	if (!isAxiomConfigured()) {
		return
	}

	// Add to buffer
	logBuffer.push(entry)

	// Flush immediately for errors, or if batch is full
	if (level === 'error' || logBuffer.length >= MAX_BATCH_SIZE) {
		await flushLogs()
	} else {
		scheduleFlush()
	}
}

/**
 * The main logger interface - backward compatible with existing usage
 *
 * @example
 * ```ts
 * // Basic logging
 * await log.info('user.login', { userId: '123', email: 'user@example.com' })
 * await log.error('payment.failed', { orderId: '456', error: serializeError(err) })
 *
 * // With request context
 * await withLogContext({ requestId: 'req_123', userId: 'user_456' }, async () => {
 *   await log.info('processing.started', { step: 1 })
 *   // ... context is automatically attached to all logs
 * })
 * ```
 */
export const log = {
	/**
	 * Write a log entry at the specified level
	 */
	async write(
		level: LogLevel,
		event: string,
		data: Record<string, unknown>,
	): Promise<void> {
		return write(level, event, data)
	},

	/**
	 * Log an info-level message
	 */
	async info(event: string, data: Record<string, unknown> = {}): Promise<void> {
		return write('info', event, data)
	},

	/**
	 * Log an error-level message
	 */
	async error(
		event: string,
		data: Record<string, unknown> = {},
	): Promise<void> {
		return write('error', event, data)
	},

	/**
	 * Log a warning-level message
	 */
	async warn(event: string, data: Record<string, unknown> = {}): Promise<void> {
		return write('warn', event, data)
	},

	/**
	 * Log a debug-level message
	 */
	async debug(
		event: string,
		data: Record<string, unknown> = {},
	): Promise<void> {
		return write('debug', event, data)
	},

	/**
	 * Flush all buffered logs immediately
	 * Call this before process exit or in response handlers
	 */
	async flush(): Promise<void> {
		if (flushTimer) {
			clearTimeout(flushTimer)
			flushTimer = null
		}
		await flushLogs()

		// Also flush Axiom's internal buffer
		const client = await getAxiomClient()
		if (client) {
			await client.flush()
		}
	},
}

/**
 * Run a function with log context attached to all logs within the scope
 *
 * @param context - The context to attach to logs
 * @param fn - The function to run
 * @returns The return value of the function
 *
 * @example
 * ```ts
 * await withLogContext({ requestId: 'req_123', userId: 'user_456' }, async () => {
 *   await log.info('request.started', {})
 *   // ... do work ...
 *   await log.info('request.completed', {})
 * })
 * ```
 */
export function withLogContext<T>(context: LogContext, fn: () => T): T {
	return contextStorage.run(context, fn)
}

/**
 * Get the current log context (if any)
 */
export function getLogContext(): LogContext | undefined {
	return contextStorage.getStore()
}

/**
 * Create a context from a Next.js request
 */
export function createRequestContext(
	request: Request,
	userId?: string,
): LogContext {
	const url = new URL(request.url)
	return {
		requestId: crypto.randomUUID(),
		userId,
		path: url.pathname,
		method: request.method,
	}
}

// Register shutdown handlers to ensure logs are flushed
if (typeof process !== 'undefined') {
	const shutdown = async () => {
		await log.flush()
	}

	process.on('beforeExit', shutdown)
	process.on('SIGINT', async () => {
		await shutdown()
		process.exit(0)
	})
	process.on('SIGTERM', async () => {
		await shutdown()
		process.exit(0)
	})
}
