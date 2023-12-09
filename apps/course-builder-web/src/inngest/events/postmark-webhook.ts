import {z} from 'zod'

export const POSTMARK_WEBHOOK_EVENT = 'postmark/web-hook-event'

export type PostmarkWebhook = {
  name: typeof POSTMARK_WEBHOOK_EVENT
  data: PostmarkWebhookEvent
}

const PostmarkWebhookEventSchema = z.discriminatedUnion('RecordType', [
  z.object({
    RecordType: z.literal('SubscriptionChange'),
    Recipient: z.string().email(),
    SuppressionReason: z.enum([
      'HardBounce',
      'SpamComplaint',
      'ManualSuppression',
    ]),
    SuppressSending: z.boolean(),
    MessageID: z.string(),
    MessageStream: z.string(),
    Metadata: z.record(z.string()),
  }),
  z.object({
    RecordType: z.literal('Bounce'),
    Email: z.string().email(),
    From: z.string().email(),
    Details: z.string(),
    Content: z.string(),
    Description: z.string(),
    MessageID: z.string(),
    MessageStream: z.string(),
    Metadata: z.record(z.string()),
  }),
  z.object({
    RecordType: z.literal('SpamComplaint'),
    Email: z.string().email(),
    From: z.string().email(),
    Details: z.string(),
    Content: z.string(),
    Description: z.string(),
    MessageID: z.string(),
    MessageStream: z.string(),
    Metadata: z.record(z.string()),
  }),
  z.object({
    RecordType: z.literal('Open'),
    Client: z.string(),
    OS: z.string(),
    Platform: z.string(),
    UserAgent: z.string(),
    ReadSeconds: z.number(),
    Geo: z.object({
      CountryISOCode: z.string(),
      Country: z.string(),
      RegionISOCode: z.string(),
      Region: z.string(),
      City: z.string(),
      Zip: z.string(),
      Coords: z.string(),
    }),
    MessageID: z.string(),
    MessageStream: z.string(),
    Metadata: z.record(z.string()),
  }),
  z.object({
    RecordType: z.literal('Click'),
    OriginalLink: z.string(),
    ClickedLink: z.string(),
    Client: z.string(),
    OS: z.string(),
    Platform: z.string(),
    UserAgent: z.string(),
    Geo: z.object({
      CountryISOCode: z.string(),
      Country: z.string(),
      RegionISOCode: z.string(),
      Region: z.string(),
      City: z.string(),
      Zip: z.string(),
      Coords: z.string(),
    }),
    MessageID: z.string(),
    MessageStream: z.string(),
    Metadata: z.record(z.string()),
  }),
  z.object({
    RecordType: z.literal('Delivery'),
    Recipient: z.string().email(),
    Tag: z.string(),
    MessageID: z.string(),
    MessageStream: z.string(),
    Metadata: z.record(z.string()),
  }),
])

export type PostmarkWebhookEvent = z.infer<typeof PostmarkWebhookEventSchema>
