/**
 * Error serialization utilities for structured logging
 *
 * @module logger-utils
 */

/**
 * Serialized error representation suitable for JSON logging
 */
export interface SerializedError {
	message: string
	name?: string
	stack?: string
	cause?: SerializedError
	code?: string | number
	[key: string]: unknown
}

/**
 * Serializes an error object into a structured format suitable for logging
 *
 * Handles:
 * - Standard Error objects with message, name, stack, and cause
 * - AggregateError with multiple errors
 * - Custom error properties (code, statusCode, etc.)
 * - Circular references
 * - Non-Error thrown values
 *
 * @param error - The error to serialize (can be any thrown value)
 * @param seen - Internal set to track circular references
 * @returns Serialized error object with all relevant properties
 *
 * @example
 * ```ts
 * try {
 *   throw new Error('Connection failed')
 * } catch (error) {
 *   const serialized = serializeError(error)
 *   // {
 *   //   message: "Connection failed",
 *   //   name: "Error",
 *   //   stack: "Error: Connection failed\n    at ...",
 *   // }
 * }
 * ```
 *
 * @example
 * ```ts
 * // With cause chain
 * const cause = new Error('ECONNREFUSED')
 * const error = new Error('Connection failed', { cause })
 * const serialized = serializeError(error)
 * // {
 *   //   message: "Connection failed",
 *   //   name: "Error",
 *   //   stack: "Error: Connection failed\n    at ...",
 *   //   cause: {
 *   //     message: "ECONNREFUSED",
 *   //     name: "Error",
 *   //     stack: "Error: ECONNREFUSED\n    at ..."
 *   //   }
 *   // }
 * ```
 */
export function serializeError(
	error: unknown,
	seen: Set<unknown> = new Set(),
): SerializedError {
	// Handle null/undefined
	if (error == null) {
		return { message: String(error) }
	}

	// Detect circular references
	if (seen.has(error)) {
		return { message: '[Circular Reference]' }
	}

	// Handle Error objects
	if (error instanceof Error) {
		seen.add(error)

		const serialized: SerializedError = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		}

		// Handle cause chain recursively
		if (error.cause !== undefined) {
			serialized.cause = serializeError(error.cause, seen)
		}

		// Handle AggregateError
		if ('errors' in error && Array.isArray((error as AggregateError).errors)) {
			serialized.errors = (error as AggregateError).errors.map((e) =>
				serializeError(e, seen),
			)
		}

		// Capture custom properties on Error subclasses
		// Common ones: code, statusCode, errno, syscall, hostname, port
		const customProps = [
			'code',
			'statusCode',
			'errno',
			'syscall',
			'hostname',
			'port',
			'path',
			'dest',
			'address',
		]

		for (const prop of customProps) {
			if (
				prop in error &&
				error[prop as keyof Error] !== undefined &&
				!(prop in serialized)
			) {
				const value = error[prop as keyof Error]
				// Only include serializable values
				if (
					typeof value === 'string' ||
					typeof value === 'number' ||
					typeof value === 'boolean'
				) {
					serialized[prop] = value
				}
			}
		}

		return serialized
	}

	// Handle non-Error throws (strings, objects, primitives)
	if (typeof error === 'object') {
		seen.add(error)

		const obj = error as Record<string, unknown>
		const serialized: SerializedError = {
			message: obj.message ? String(obj.message) : JSON.stringify(error),
		}

		// Try to extract useful properties from plain objects
		if ('name' in obj && typeof obj.name === 'string') {
			serialized.name = obj.name
		}
		if ('stack' in obj && typeof obj.stack === 'string') {
			serialized.stack = obj.stack
		}
		if ('code' in obj) {
			serialized.code = obj.code as string | number
		}

		return serialized
	}

	// Handle primitive throws (strings, numbers, etc.)
	return {
		message: String(error),
	}
}
