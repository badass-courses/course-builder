export class EggheadApiError extends Error {
	status: number
	constructor(message = 'Egghead API Error', status = 500) {
		super(message)
		this.name = 'EggheadApiError'
		this.status = status
	}
}
