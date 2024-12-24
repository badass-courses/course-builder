export class PostCreationError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
		public readonly context?: Record<string, unknown>,
	) {
		super(message)
		this.name = 'PostCreationError'
	}
}

export class ExternalServiceError extends PostCreationError {
	constructor(
		service: 'egghead' | 'sanity',
		operation: string,
		cause?: unknown,
		context?: Record<string, unknown>,
	) {
		super(`Failed to perform ${operation} on ${service}`, cause, context)
		this.name = 'ExternalServiceError'
	}
}

export class DatabaseError extends PostCreationError {
	constructor(
		operation: string,
		cause?: unknown,
		context?: Record<string, unknown>,
	) {
		super(`Database operation failed: ${operation}`, cause, context)
		this.name = 'DatabaseError'
	}
}
