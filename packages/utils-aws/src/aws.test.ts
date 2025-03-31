import { beforeEach, describe, expect, it, vi } from 'vitest'

import { performOCR, uploadImage } from './aws'

// Mock AWS SDK clients
vi.mock('@aws-sdk/client-s3', () => {
	const mockSend = vi.fn().mockResolvedValue({ success: true })
	return {
		S3Client: vi.fn().mockImplementation(() => ({
			send: mockSend,
		})),
		PutObjectCommand: vi.fn().mockImplementation((params) => params),
	}
})

vi.mock('@aws-sdk/client-textract', () => {
	const mockSend = vi.fn().mockResolvedValue({
		Blocks: [{ Text: 'Hello' }, { Text: 'World' }],
	})
	return {
		TextractClient: vi.fn().mockImplementation(() => ({
			send: mockSend,
		})),
		DetectDocumentTextCommand: vi.fn().mockImplementation((params) => params),
	}
})

vi.mock('@aws-sdk/credential-providers', () => ({
	fromEnv: vi
		.fn()
		.mockReturnValue({ accessKeyId: 'test', secretAccessKey: 'test' }),
}))

describe('AWS Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('performOCR', () => {
		it('should return text extracted from an image in S3', async () => {
			const result = await performOCR('test-bucket', 'test-key.jpg')

			expect(result).toBe('Hello\nWorld')
		})
	})

	describe('uploadImage', () => {
		it('should upload an image to S3 with the correct parameters', async () => {
			const buffer = Buffer.from('test image data')
			const contentType = 'image/jpeg'
			const contentLength = buffer.length

			await uploadImage(
				'test-bucket',
				'test-key.jpg',
				buffer,
				contentType,
				contentLength,
			)

			// We can't easily check the mocked S3Client internals directly,
			// but we can verify the PutObjectCommand was called with the right params
			const { PutObjectCommand } = await import('@aws-sdk/client-s3')

			expect(PutObjectCommand).toHaveBeenCalledWith({
				Bucket: 'test-bucket',
				Key: 'test-key.jpg',
				ContentType: contentType,
				ContentLength: contentLength,
				Body: buffer,
			})
		})
	})
})
