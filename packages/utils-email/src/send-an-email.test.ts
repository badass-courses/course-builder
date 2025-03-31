import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendAnEmail } from './send-an-email'

// Mock the React Email render function
vi.mock('@react-email/render', () => ({
	render: vi.fn().mockReturnValue('<div>Mocked Email HTML</div>'),
}))

// Mock global.fetch
global.fetch = vi.fn()

// Create a spy on console.log
const consoleLogSpy = vi.spyOn(console, 'log')

describe('sendAnEmail', () => {
	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks()

		// Setup environment variables for testing
		vi.stubGlobal('process', {
			env: {
				NEXT_PUBLIC_SITE_TITLE: 'Test Site',
				NEXT_PUBLIC_SUPPORT_EMAIL: 'support@test.com',
				POSTMARK_API_KEY: 'test-api-key',
			},
		})

		// Setup fetch response
		const mockResponse = {
			json: vi.fn().mockResolvedValue({ ErrorCode: 0, Message: 'OK' }),
		}
		;(global.fetch as any).mockResolvedValue(mockResponse)
	})

	it('should send an email with correct parameters', async () => {
		// Create a simple mock component
		const TestEmailComponent = () => null as any

		// Call the function with necessary parameters
		await sendAnEmail({
			Component: TestEmailComponent,
			componentProps: { name: 'Test User' },
			Subject: 'Test Subject',
			To: 'user@example.com',
			ReplyTo: 'reply@example.com',
		})

		// Verify fetch was called correctly
		expect(global.fetch).toHaveBeenCalledWith(
			'https://api.postmarkapp.com/email',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'X-Postmark-Server-Token': 'test-api-key',
				}),
			}),
		)

		// Verify the email options were set correctly
		const fetchCall = (global.fetch as any).mock.calls[0]
		const requestBody = JSON.parse(fetchCall[1].body)

		expect(requestBody).toEqual(
			expect.objectContaining({
				Subject: 'Test Subject',
				To: 'user@example.com',
				ReplyTo: 'reply@example.com',
				From: 'Test Site <support@test.com>',
				HtmlBody: '<div>Mocked Email HTML</div>',
				MessageStream: 'outbound',
			}),
		)
	})

	it('should use broadcast message stream when specified', async () => {
		// Create a simple mock component
		const TestEmailComponent = () => null as any

		// Call the function with broadcast type
		await sendAnEmail({
			Component: TestEmailComponent,
			componentProps: {},
			Subject: 'Broadcast Subject',
			To: 'users@example.com',
			type: 'broadcast',
		})

		// Check that the message stream is set to broadcast
		const fetchCall = (global.fetch as any).mock.calls[0]
		const requestBody = JSON.parse(fetchCall[1].body)
		expect(requestBody.MessageStream).toBe('broadcast')
	})

	it('should skip sending email when SKIP_EMAIL is true', async () => {
		// Set SKIP_EMAIL environment variable
		vi.stubGlobal('process', {
			env: {
				NEXT_PUBLIC_SITE_TITLE: 'Test Site',
				NEXT_PUBLIC_SUPPORT_EMAIL: 'support@test.com',
				POSTMARK_API_KEY: 'test-api-key',
				SKIP_EMAIL: 'true',
			},
		})

		// Create a simple mock component
		const TestEmailComponent = () => null as any

		// Call the function
		const result = await sendAnEmail({
			Component: TestEmailComponent,
			componentProps: {},
			Subject: 'Skip Email Test',
			To: 'user@example.com',
		})

		// Verify fetch was not called
		expect(global.fetch).not.toHaveBeenCalled()

		// Verify console.log was called
		expect(consoleLogSpy).toHaveBeenCalledWith(
			'SKIP_EMAIL is set, skipping email',
		)

		// Verify the returned options
		expect(result).toEqual(
			expect.objectContaining({
				Subject: 'Skip Email Test',
				To: 'user@example.com',
				HtmlBody: '<div>Mocked Email HTML</div>',
			}),
		)
	})

	it('should throw error when POSTMARK_API_KEY is not set', async () => {
		// Remove API key from environment
		vi.stubGlobal('process', {
			env: {
				NEXT_PUBLIC_SITE_TITLE: 'Test Site',
				NEXT_PUBLIC_SUPPORT_EMAIL: 'support@test.com',
				// No POSTMARK_API_KEY
			},
		})

		// Create a simple mock component
		const TestEmailComponent = () => null as any

		// Verify the function throws the expected error
		await expect(async () => {
			await sendAnEmail({
				Component: TestEmailComponent,
				componentProps: {},
				Subject: 'Error Test',
				To: 'user@example.com',
			})
		}).rejects.toThrow('POSTMARK_API_KEY environment variable is not set')
	})
})
