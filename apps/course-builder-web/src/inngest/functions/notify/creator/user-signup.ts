import {inngest} from '@/inngest/inngest.server'
import {USER_CREATED_EVENT} from '@/inngest/events'
import BasicEmail from '@/emails/basic-email'
import {sendAnEmail} from '@/utils/send-an-email'
import {sanityQuery} from '@/server/sanity.server'
import {Liquid} from 'liquidjs'

export const userSignupAdminEmail = inngest.createFunction(
  {
    id: `user-signup-admin-email`,
    name: 'User Signup Admin Email',
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
      }>(`*[_type == "courseBuilderEmail" && slug.current == "user-signup"][0]`)
    })

    const parsedEmailBody: string = await step.run(
      `parse email body`,
      async () => {
        try {
          const engine = new Liquid()
          return engine.parseAndRender(email.body, {user: event.user})
        } catch (e: any) {
          console.error(e.message)
          return email.body
        }
      },
    )

    const parsedEmailSubject: string = await step.run(
      `parse email subject`,
      async () => {
        try {
          const engine = new Liquid()
          return engine.parseAndRender(email.subject, {user: event.user})
        } catch (e) {
          return email.subject
        }
      },
    )

    const sendResponse = await step.run('send the email', async () => {
      return await sendAnEmail({
        Component: BasicEmail,
        componentProps: {
          user: event.user,
          body: parsedEmailBody,
        },
        Subject: parsedEmailSubject,
        To: 'joel@badass.dev',
      })
    })

    return {sendResponse, email, user: event.user}
  },
)
