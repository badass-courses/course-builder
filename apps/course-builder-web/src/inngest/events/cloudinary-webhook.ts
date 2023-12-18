import {z} from 'zod'

const NotificationContextSchema = z.object({
  triggered_at: z.string(),
})

const NotificationDataSchema = z.object({
  notification_type: z.string(),
  timestamp: z.string(),
  request_id: z.string(),
  asset_id: z.string(),
  public_id: z.string(),
  version: z.number(),
  version_id: z.string(),
  width: z.number(),
  height: z.number(),
  format: z.string(),
  resource_type: z.string(),
  created_at: z.string(),
  tags: z.array(z.string()),
  bytes: z.number(),
  type: z.string(),
  etag: z.string(),
  placeholder: z.boolean(),
  url: z.string(),
  secure_url: z.string(),
  folder: z.string(),
  access_mode: z.string(),
  original_filename: z.string(),
  notification_context: NotificationContextSchema,
  signature_key: z.string(),
})

export const CLOUDINARY_WEBHOOK_EVENT = 'cloudinary/web-hook-event'

export type CloudinaryWebhook = {
  name: typeof CLOUDINARY_WEBHOOK_EVENT
  data: CloudinaryWebhookEvent
}
export const CloudinaryWebhookEventSchema = NotificationDataSchema

export type CloudinaryWebhookEvent = z.infer<
  typeof CloudinaryWebhookEventSchema
>
