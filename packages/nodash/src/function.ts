/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait = 0,
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | undefined

	return function debounced(this: any, ...args: Parameters<T>) {
		const context = this

		clearTimeout(timeoutId)
		timeoutId = setTimeout(() => {
			func.apply(context, args)
		}, wait)
	}
}
