/**
 * Base error class for resource creation errors
 *
 * @class ResourceCreationError
 * @extends {Error}
 * @property {string} type - The type of error (e.g., 'validation_error', 'invalid_resource_type')
 * @property {Record<string, any>} [details] - Additional details about the error
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
 * Used when input data fails validation requirements
 *
 * @class ResourceValidationError
 * @extends {ResourceCreationError}
 * @property {Record<string, any>} [details] - Details about the validation error,
 *   typically including field name and invalid value
 */
export class ResourceValidationError extends ResourceCreationError {
	constructor(message: string, details?: Record<string, any>) {
		super(message, 'validation_error', details)
		this.name = 'ResourceValidationError'
	}
}

/**
 * Error class for invalid resource type errors
 * Used when an operation is attempted with an invalid or unsupported resource type
 *
 * @class InvalidResourceTypeError
 * @extends {ResourceCreationError}
 * @property {Record<string, any>} [details] - Details about the type error,
 *   typically including the invalid type and a list of valid types
 */
export class InvalidResourceTypeError extends ResourceCreationError {
	constructor(message: string, details?: Record<string, any>) {
		super(message, 'invalid_resource_type', details)
		this.name = 'InvalidResourceTypeError'
	}
}
