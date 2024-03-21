import { env } from '@/env.mjs'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  DetectDocumentTextCommand,
  TextractClient,
} from '@aws-sdk/client-textract'
import { fromEnv } from '@aws-sdk/credential-providers'

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: fromEnv(),
})
const textractClient = new TextractClient({
  region: env.AWS_REGION,
  credentials: fromEnv(),
})

export async function performOCR(s3_bucket: string, s3_key: string) {
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
