import {inngest} from '@/inngest/inngest.server'
import {POSTMARK_WEBHOOK_EVENT} from '@/inngest/events/postmark-webhook'

export const postmarkWebhook = inngest.createFunction(
  {id: `postmark-webhooks`, name: 'Postmark Unsubscribed Webhooks'},
  {
    event: POSTMARK_WEBHOOK_EVENT,
    if: 'event.data.RecordType in ["Bounce", "SpamComplaint", "SubscriptionChange"]',
  },
  async ({event, step}) => {
    switch (event.data.RecordType) {
      case 'SubscriptionChange': {
        if (event.data.SuppressionReason === 'ManualSuppression') {
          //unsubscribed
        } else if (!event.data.SuppressSending) {
          //resubscribed?
        }
        break
      }
      case 'Bounce': {
        // something went wrong, display in app message
        break
      }
      case 'SpamComplaint': {
        // something
        break
      }
    }
    return event.data
  },
)
