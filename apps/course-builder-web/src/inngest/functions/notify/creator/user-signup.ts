import BasicEmail from '@/emails/basic-email'
import { USER_CREATED_EVENT } from '@/inngest/events/user-created'
import { inngest } from '@/inngest/inngest.server'
import { sendAnEmail } from '@/utils/send-an-email'
import { Liquid } from 'liquidjs'

export const userSignupAdminEmail = inngest.createFunction(
  {
    id: `user-signup-admin-email`,
    name: 'User Signup Admin Email',
    idempotency: 'event.user.email',
  },
  {
    event: USER_CREATED_EVENT,
  },
  async ({ event, step }) => {
    const email = {
      body: `Course Builder is an experimental project by [Joel Hooks](https://x.com/jhooks). 
          
Read more about Badass Courses at [https://badass.dev](https://badass.dev).

If you have any questions or feedback, please reply to this email and let me know.

Cheers,

Joel`,
      subject: 'Welcome to Course Builder!',
    }

    const parsedEmailBody: string = await step.run(`parse email body`, async () => {
      try {
        const engine = new Liquid()
        return engine.parseAndRender(email.body, { user: event.user })
      } catch (e: any) {
        console.error(e.message)
        return email.body
      }
    })

    const parsedEmailSubject: string = await step.run(`parse email subject`, async () => {
      try {
        const engine = new Liquid()
        return engine.parseAndRender(email.subject, { user: event.user })
      } catch (e) {
        return email.subject
      }
    })

    const sendResponse = await step.run('send the email', async () => {
      return await sendAnEmail({
        Component: BasicEmail,
        componentProps: {
          body: parsedEmailBody,
        },
        Subject: parsedEmailSubject,
        To: 'joel@badass.dev',
      })
    })

    return { sendResponse, email, user: event.user }
  },
)
