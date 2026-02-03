export class WorkshopError extends Error {
	constructor(
		message: string,
		public statusCode: number = 400,
		public details?: unknown,
	) {
		super(message)
	}
}
