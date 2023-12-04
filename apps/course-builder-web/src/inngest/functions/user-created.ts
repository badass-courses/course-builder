import {inngest} from '@/inngest/inngest.server'
import {USER_CREATED_EVENT} from '@/inngest/events'
import WelcomeEmail from '@/emails/welcome-email'
import {sendAnEmail} from '@/utils/send-an-email'
import {sanityQuery} from '@/server/sanity.server'

const userCreatedEmailBody = `Course Builder is an experimental project by [Joel Hooks](https://x.com/jhooks). 
          
Read more about Badass Courses at [https://badass.dev](https://badass.dev).

If you have any questions or feedback, please reply to this email and let me know.

Cheers,

Joel`

export const userCreated = inngest.createFunction(
  {id: `user created`, name: 'User Created'},
  {event: USER_CREATED_EVENT},
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
