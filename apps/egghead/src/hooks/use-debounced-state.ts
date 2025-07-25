import * as React from 'react'

/**
 * A hook that provides a debounced value and a function to update it.
 *
 * @param {T} initialValue The initial value of the state.
 * @param {number} delay The delay in milliseconds before the value is updated.
 * @returns {[T, (value: T) => void]} A tuple containing the debounced value and a function to update it.
 *
 * @example
 * const [debouncedValue, setValue] = useDebouncedState(initialValue, 500)
 */
export function useDebouncedState<T>(
	initialValue: T,
	delay: number,
): [T, (value: T) => void] {
	const [value, setValue] = React.useState<T>(initialValue)
	const [debouncedValue, setDebouncedValue] = React.useState<T>(initialValue)

	React.useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return [debouncedValue, setValue]
}
