import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

const options: S3ClientConfig = {
	region: process.env.AWS_VIDEO_UPLOAD_REGION,
	credentials: {
		accessKeyId: process.env.AWS_VIDEO_UPLOAD_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_VIDEO_UPLOAD_SECRET_ACCESS_KEY!,
	},
}

const client = new S3Client(options)

export async function getSignedUrlForVideoFile(options: { filename: string }) {
	const filename = `${uuidv4()}/${options.filename}`
	const Key = `${
		process.env.AWS_VIDEO_UPLOAD_FOLDER || 'partner-uploads'
	}/${filename}`
	const Bucket = process.env.AWS_VIDEO_UPLOAD_BUCKET
	const expiresIn = 3600

	const command = new PutObjectCommand({ Bucket, Key })
	const signedUrl = await getSignedUrl(client, command, { expiresIn })

	if (signedUrl) {
		return {
			signedUrl,
			filename,
			objectName: options.filename,
			publicUrl: signedUrl.split('?').shift(),
		}
	}
}
