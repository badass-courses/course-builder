import { env } from '@/env.mjs'
import aws from 'aws-sdk'

aws.config.update({
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
})

const s3 = new aws.S3()

const textract = new aws.Textract()

export async function performOCR(s3_bucket: string, s3_key: string) {
  const params = {
    Document: {
      S3Object: {
        Bucket: s3_bucket,
        Name: s3_key,
      },
    },
  }

  const response = await textract.detectDocumentText(params).promise()

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
  return await s3
    .putObject({
      Bucket: s3_bucket,
      Key: s3_key,
      ContentType: contentType,
      ContentLength: contentLength,
      Body: image,
    })
    .promise()
}
