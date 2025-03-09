// This must be at the top of the file
import cookies from 'js-cookie'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Import after mocks
import cookieUtil from './cookies'

// Need to mock window before importing the utility
vi.stubGlobal('window', {
	location: {
		protocol: 'https:',
	},
})

// Mock modules must use inline variables,
// not references to variables declared elsewhere in the file
vi.mock('js-cookie', () => ({
	default: {
		get: vi.fn(),
		set: vi.fn(),
		remove: vi.fn(),
	},
}))

vi.mock('@coursebuilder/nodash', () => ({
	isString: (val: any) => typeof val === 'string',
}))

describe('cookieUtil', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('set', () => {
		it('sets string values directly', () => {
			// Setup
			vi.mocked(cookies.get).mockReturnValue('test-value')

			// Execute
			const result = cookieUtil.set('test-key', 'test-value')

			// Verify
			expect(cookies.set).toHaveBeenCalledWith('test-key', 'test-value', {
				secure: true,
				path: '/',
				expires: 365,
			})
			expect(result).toBe('test-value')
		})

		it('accepts custom options', () => {
			// Setup
			const options = { expires: 7, path: '/dashboard' }

			// Execute
			cookieUtil.set('test-key', 'test-value', options)

			// Verify
			expect(cookies.set).toHaveBeenCalledWith('test-key', 'test-value', {
				secure: true,
				path: '/dashboard',
				expires: 7,
			})
		})
	})

	describe('get', () => {
		it('returns null if cookie not found', () => {
			// Setup
			vi.mocked(cookies.get).mockReturnValue(undefined)

			// Execute
			const result = cookieUtil.get('nonexistent')

			// Verify
			expect(result).toBeNull()
		})

		it('returns string values as is', () => {
			// Setup
			vi.mocked(cookies.get).mockReturnValue('test-value')

			// Execute
			const result = cookieUtil.get('test-key')

			// Verify
			expect(result).toBe('test-value')
		})

		it('parses JSON values', () => {
			// Setup
			const testObj = { foo: 'bar' }
			vi.mocked(cookies.get).mockReturnValue(JSON.stringify(testObj))

			// Execute
			const result = cookieUtil.get('test-key')

			// Verify
			expect(result).toEqual(testObj)
		})
	})

	describe('remove', () => {
		it('removes a cookie with default options', () => {
			// Execute
			cookieUtil.remove('test-key')

			// Verify
			expect(cookies.remove).toHaveBeenCalledWith('test-key', {})
		})

		it('removes a cookie with custom options', () => {
			// Setup
			const options = { path: '/dashboard' }

			// Execute
			cookieUtil.remove('test-key', options)

			// Verify
			expect(cookies.remove).toHaveBeenCalledWith('test-key', options)
		})
	})
})
