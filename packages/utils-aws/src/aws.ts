import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
	DetectDocumentTextCommand,
	TextractClient,
} from '@aws-sdk/client-textract'
import { fromEnv } from '@aws-sdk/credential-providers'

/**
 * S3 client for AWS storage operations
 * @private Internal client, not exported
 */
const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: fromEnv(),
})

/**
 * Textract client for AWS OCR operations
 * @private Internal client, not exported
 */
const textractClient = new TextractClient({
	region: process.env.AWS_REGION,
	credentials: fromEnv(),
})

/**
 * Performs Optical Character Recognition (OCR) on an image stored in S3 using AWS Textract
 *
 * @param s3_bucket - The S3 bucket name where the image is stored
 * @param s3_key - The S3 object key for the image
 * @returns A string containing all detected text with newlines between blocks
 *
 * @example
 * ```ts
 * const extractedText = await performOCR('my-bucket', 'images/screenshot.jpg')
 * console.log(extractedText) // "Text from the image\nMore text from the image"
 * ```
 */
export async function performOCR(
	s3_bucket: string,
	s3_key: string,
): Promise<string> {
	const command = new DetectDocumentTextCommand({
		Document: {
			S3Object: {
				Bucket: s3_bucket,
				Name: s3_key,
			},
		},
	})

	const response = await textractClient.send(command)

	const text = response.Blocks?.map((block) => block.Text)

	return text?.join('\n') ?? ''
}

/**
 * Uploads an image to an S3 bucket
 *
 * @param s3_bucket - The S3 bucket name to upload to
 * @param s3_key - The S3 object key to use for the uploaded image
 * @param image - The image data as a Buffer
 * @param contentType - The MIME type of the image (e.g., 'image/jpeg', 'image/png')
 * @param contentLength - The size of the image in bytes
 * @returns The result of the S3 upload operation
 *
 * @example
 * ```ts
 * const imageBuffer = Buffer.from(imageData)
 * const result = await uploadImage(
 *   'my-bucket',
 *   'uploads/profile.jpg',
 *   imageBuffer,
 *   'image/jpeg',
 *   imageBuffer.length
 * )
 * ```
 */
export async function uploadImage(
	s3_bucket: string,
	s3_key: string,
	image: Buffer,
	contentType: string,
	contentLength: number,
) {
	const command = new PutObjectCommand({
		Bucket: s3_bucket,
		Key: s3_key,
		ContentType: contentType,
		ContentLength: contentLength,
		Body: image,
	})
	return await s3Client.send(command)
}
