import {inngest} from "@/inngest/inngest.server";
import {USER_CREATED_EVENT} from "@/inngest/events";
import {render} from "@react-email/render";
import {env} from "@/env.mjs";
import WelcomeEmail from "@/emails/welcome-email";

export async function sendTheEmail<ComponentPropsType = any>({
 Component,
 componentProps,
 Subject,
 To,
 From = `joel <joel@coursebuilder.dev>`,
}: {
  Component: (props: ComponentPropsType) => React.JSX.Element
  componentProps: ComponentPropsType
  Subject: string
  From?: string
  To: string
}) {
  const emailHtml = render(Component(componentProps))

  const options = {
    From,
    To,
    Subject,
    HtmlBody: emailHtml,
    MessageStream: `outbound`
  }

  return await fetch(`https://api.postmarkapp.com/email`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': env.POSTMARK_API_KEY
    },
    body: JSON.stringify(options)
  })
}

export const userCreated = inngest.createFunction(
  {id: `user created`, name: 'User Created'},
  {event: USER_CREATED_EVENT},
  async ({event, step}) => {

    const sendResponse = await step.run('send the email', async () => {
      return await sendTheEmail({
        Component: WelcomeEmail,
        componentProps: {
          user: event.user,
          body: `Course Builder is an experimental project by [Joel Hooks](https://x.com/jhooks). 
          
Read more about Badass Courses at [https://badass.dev](https://badass.dev).

If you have any questions or feedback, please reply to this email and let me know.

Cheers,

Joel`
        },
        Subject: 'Welcome to Course Builder!',
        To: event.user.email
      })
    })

    return {sendResponse, user: event.user}
  }
)




