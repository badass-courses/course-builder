/**
 * Error class for resource creation errors
 */
export class ResourceCreationError extends Error {
	constructor(
		message: string,
		public readonly type: string,
		public readonly details?: Record<string, any>,
	) {
		super(message)
		this.name = 'ResourceCreationError'
	}
}

/**
 * Error class for resource validation errors
 */
export class ResourceValidationError extends ResourceCreationError {
	constructor(message: string, details?: Record<string, any>) {
		super(message, 'validation_error', details)
		this.name = 'ResourceValidationError'
	}
}

/**
 * Error class for invalid resource types
 */
export class InvalidResourceTypeError extends ResourceCreationError {
	constructor(message: string, details?: Record<string, any>) {
		super(message, 'invalid_resource_type', details)
		this.name = 'InvalidResourceTypeError'
	}
}
