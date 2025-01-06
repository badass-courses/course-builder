import { describe, expect, test, vi } from 'vitest'

import { debounce } from '../function'

describe('debounce', () => {
	test('delays function execution', async () => {
		vi.useFakeTimers()
		const func = vi.fn()
		const debounced = debounce(func, 100)

		debounced()
		expect(func).not.toBeCalled()

		vi.advanceTimersByTime(50)
		expect(func).not.toBeCalled()

		vi.advanceTimersByTime(50)
		expect(func).toBeCalledTimes(1)

		vi.useRealTimers()
	})

	test('only executes once for multiple calls within wait period', () => {
		vi.useFakeTimers()
		const func = vi.fn()
		const debounced = debounce(func, 100)

		debounced()
		debounced()
		debounced()
		expect(func).not.toBeCalled()

		vi.advanceTimersByTime(100)
		expect(func).toBeCalledTimes(1)

		vi.useRealTimers()
	})

	test('uses latest arguments', () => {
		vi.useFakeTimers()
		const func = vi.fn()
		const debounced = debounce(func, 100)

		debounced(1)
		debounced(2)
		debounced(3)
		expect(func).not.toBeCalled()

		vi.advanceTimersByTime(100)
		expect(func).toBeCalledWith(3)

		vi.useRealTimers()
	})

	test('preserves context', () => {
		vi.useFakeTimers()
		const context = { value: 42 }
		const func = vi.fn(function (this: typeof context) {
			expect(this.value).toBe(42)
		})
		const debounced = debounce(func, 100)

		debounced.call(context)
		vi.advanceTimersByTime(100)
		expect(func).toBeCalledTimes(1)

		vi.useRealTimers()
	})

	test('uses default wait time of 0ms', () => {
		vi.useFakeTimers()
		const func = vi.fn()
		const debounced = debounce(func)

		debounced()
		vi.advanceTimersByTime(0)
		expect(func).toBeCalledTimes(1)

		vi.useRealTimers()
	})
})
