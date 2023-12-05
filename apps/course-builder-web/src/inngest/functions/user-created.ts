import {inngest} from '@/inngest/inngest.server'
import {USER_CREATED_EVENT} from '@/inngest/events'
import WelcomeEmail from '@/emails/welcome-email'
import {sendAnEmail} from '@/utils/send-an-email'
import {sanityQuery} from '@/server/sanity.server'

export const userCreated = inngest.createFunction(
  {
    id: `user created`,
    name: 'User Created',
    idempotency: 'event.user.email',
  },
  {
    event: USER_CREATED_EVENT,
  },
  async ({event, step}) => {
    const email = await step.run(`load email`, async () => {
      return await sanityQuery<{
        _id: string
        subject: string
        body: string
        previewText?: string
      }>(
        `*[_type == "courseBuilderEmail" && slug.current == "welcome-email"][0]`,
      )
    })
    const sendResponse = await step.run('send the email', async () => {
      return await sendAnEmail({
        Component: WelcomeEmail,
        componentProps: {
          user: event.user,
          body: email.body,
        },
        Subject: email.subject,
        To: event.user.email,
      })
    })

    return {sendResponse, email, user: event.user}
  },
)
