import { AuthConfig } from '@auth/core'
import { describe, expect, it } from 'vitest'

import { CourseBuilderConfig } from '../src'
import { init } from '../src/lib/init'
import Stripe from '../src/providers/stripe'

const createTestConfig = (): CourseBuilderConfig => ({
	providers: [
		Stripe({
			paymentsAdapter: {} as any,
			errorRedirectUrl: 'http://test.com/error',
			cancelUrl: 'http://test.com/cancel',
			baseSuccessUrl: 'http://test.com/success',
		}),
	],
	baseUrl: 'http://test.com',
	authConfig: {} as AuthConfig,
})

describe('init cookies handling', () => {
	it('should convert request cookies to Cookie[] format', async () => {
		const config = createTestConfig()
		const { cookies } = await init({
			url: new URL('http://test.com/api/coursebuilder/checkout/stripe'),
			courseBuilderOptions: config,
			action: 'checkout',
			isPost: true,
			cookies: {
				sl_ref: 'my-shortlink-slug',
				other_cookie: 'other-value',
			},
		})

		expect(cookies).toHaveLength(2)
		expect(cookies.find((c) => c.name === 'sl_ref')).toEqual({
			name: 'sl_ref',
			value: 'my-shortlink-slug',
			options: {},
		})
		expect(cookies.find((c) => c.name === 'other_cookie')).toEqual({
			name: 'other_cookie',
			value: 'other-value',
			options: {},
		})
	})

	it('should handle empty cookies object', async () => {
		const config = createTestConfig()
		const { cookies } = await init({
			url: new URL('http://test.com/api/coursebuilder/checkout/stripe'),
			courseBuilderOptions: config,
			action: 'checkout',
			isPost: true,
			cookies: {},
		})

		expect(cookies).toHaveLength(0)
	})

	it('should handle undefined cookies', async () => {
		const config = createTestConfig()
		const { cookies } = await init({
			url: new URL('http://test.com/api/coursebuilder/checkout/stripe'),
			courseBuilderOptions: config,
			action: 'checkout',
			isPost: true,
			cookies: undefined,
		})

		expect(cookies).toHaveLength(0)
	})

	it('should filter out non-string cookie values', async () => {
		const config = createTestConfig()
		const { cookies } = await init({
			url: new URL('http://test.com/api/coursebuilder/checkout/stripe'),
			courseBuilderOptions: config,
			action: 'checkout',
			isPost: true,
			cookies: {
				valid_cookie: 'valid-value',
				invalid_cookie: undefined,
			},
		})

		expect(cookies).toHaveLength(1)
		expect(cookies[0]?.name).toBe('valid_cookie')
	})

	it('should allow finding sl_ref cookie for shortlink attribution', async () => {
		const config = createTestConfig()
		const { cookies } = await init({
			url: new URL('http://test.com/api/coursebuilder/checkout/stripe'),
			courseBuilderOptions: config,
			action: 'checkout',
			isPost: true,
			cookies: {
				sl_ref: 'workshop-promo-2024',
				session_id: 'abc123',
			},
		})

		// This is exactly what checkout.ts does
		const shortlinkRefCookie = cookies.find((c) => c.name === 'sl_ref')
		const shortlinkRef = shortlinkRefCookie?.value

		expect(shortlinkRef).toBe('workshop-promo-2024')
	})
})
