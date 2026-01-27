/**
 * Logger types and interfaces for Axiom logging integration
 *
 * This module provides comprehensive type definitions for structured logging
 * with Axiom, including log levels, context tracking, and error serialization.
 *
 * @module logger-types
 */

/**
 * Available log levels in order of severity
 *
 * - debug: Detailed diagnostic information
 * - info: General informational messages
 * - warn: Warning messages for potentially problematic situations
 * - error: Error messages for failures that need attention
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Context information attached to log entries
 *
 * Provides request-scoped metadata for distributed tracing and debugging.
 * All fields are optional to support various logging scenarios.
 *
 * @example
 * ```ts
 * const context: LogContext = {
 *   requestId: 'req_abc123',
 *   userId: 'user_456',
 *   path: '/api/courses',
 *   method: 'GET'
 * }
 * ```
 */
export interface LogContext {
	/**
	 * Unique identifier for the request/operation
	 */
	requestId?: string

	/**
	 * Authenticated user identifier
	 */
	userId?: string

	/**
	 * Session identifier for tracking user sessions
	 */
	sessionId?: string

	/**
	 * Request path or operation name
	 */
	path?: string

	/**
	 * HTTP method or operation type
	 */
	method?: string
}

/**
 * A structured log entry ready for transmission to Axiom
 *
 * Combines timestamp, level, event name, context, and arbitrary data fields.
 *
 * @example
 * ```ts
 * const entry: LogEntry = {
 *   _time: new Date().toISOString(),
 *   level: 'info',
 *   event: 'user.login',
 *   context: { userId: 'user_123', requestId: 'req_abc' },
 *   email: 'user@example.com',
 *   success: true
 * }
 * ```
 */
export interface LogEntry extends Record<string, any> {
	/**
	 * ISO 8601 timestamp of when the log entry was created
	 */
	_time: string

	/**
	 * Severity level of the log entry
	 */
	level: LogLevel

	/**
	 * Event name or identifier (e.g., 'user.login', 'payment.processed')
	 */
	event: string

	/**
	 * Request-scoped context information
	 */
	context?: LogContext

	/**
	 * Additional arbitrary data fields are allowed via index signature
	 */
	[key: string]: any
}

/**
 * Configuration options for the logger instance
 *
 * Controls behavior of log batching, filtering, and Axiom integration.
 *
 * @example
 * ```ts
 * const config: LoggerConfig = {
 *   dataset: 'production-logs',
 *   token: process.env.AXIOM_TOKEN!,
 *   orgId: process.env.AXIOM_ORG_ID!,
 *   flushInterval: 5000,
 *   maxBatchSize: 100,
 *   minLevel: 'info'
 * }
 * ```
 */
export interface LoggerConfig {
	/**
	 * Axiom dataset name where logs will be sent
	 */
	dataset: string

	/**
	 * Axiom API token for authentication
	 */
	token: string

	/**
	 * Axiom organization identifier
	 */
	orgId: string

	/**
	 * Interval in milliseconds for automatic log flushing
	 * @default 5000
	 */
	flushInterval?: number

	/**
	 * Maximum number of log entries to batch before automatic flush
	 * @default 100
	 */
	maxBatchSize?: number

	/**
	 * Minimum log level to capture (filters out lower severity logs)
	 * @default 'info'
	 */
	minLevel?: LogLevel
}

/**
 * Serialized representation of an Error object
 *
 * Captures all relevant error information in a JSON-serializable format
 * for logging and debugging purposes.
 *
 * @example
 * ```ts
 * const serialized: SerializedError = {
 *   message: 'Database connection failed',
 *   name: 'DatabaseError',
 *   stack: 'Error: Database connection failed\n    at ...',
 *   code: 'ECONNREFUSED',
 *   statusCode: 500
 * }
 * ```
 */
export interface SerializedError {
	/**
	 * Error message describing what went wrong
	 */
	message: string

	/**
	 * Name/type of the error (e.g., 'TypeError', 'DatabaseError')
	 */
	name: string

	/**
	 * Stack trace showing where the error originated
	 */
	stack?: string

	/**
	 * Underlying cause if this error wraps another error
	 */
	cause?: SerializedError

	/**
	 * Error code (e.g., 'ECONNREFUSED', 'ERR_INVALID_ARG')
	 */
	code?: string

	/**
	 * Additional custom properties from the original error
	 */
	[key: string]: any
}
