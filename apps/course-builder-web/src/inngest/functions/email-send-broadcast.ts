import BasicEmail, { BasicEmailProps } from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { EMAIL_SEND_BROADCAST } from '@/inngest/events/email-send-broadcast'
import { inngest } from '@/inngest/inngest.server'
import { db } from '@/server/db'
import { NonRetriableError } from 'inngest'
import { Resend } from 'resend'

export async function sendAnEmail<ComponentPropsType = any>({
  Component,
  componentProps,
  Subject,
  To,
  From = `joel <joel@coursebuilder.dev>`,
  type = 'transactional',
  unsubscribeLinkUrl,
}: {
  Component: (props: ComponentPropsType) => React.JSX.Element
  componentProps: ComponentPropsType
  Subject: string
  From?: string
  To: string
  type?: 'transactional' | 'broadcast'
  unsubscribeLinkUrl?: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  return resend.emails.send({
    from: From,
    to: [To],
    subject: Subject,
    react: Component(componentProps),
    headers:
      type === 'broadcast' && unsubscribeLinkUrl
        ? {
            'List-Unsubscribe': `<${unsubscribeLinkUrl}>`,
          }
        : {},
  })
}

export const emailSendBroadcast = inngest.createFunction(
  {
    id: `email-send-broadcast`,
    name: 'Email: Send Broadcast',
  },
  {
    event: EMAIL_SEND_BROADCAST,
  },
  async ({ event, step }) => {
    const user = await step.run('load the user', async () => {
      return db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, event.data.toUserId),
        with: {
          communicationPreferences: {
            with: {
              preferenceType: true,
              channel: true,
            },
          },
        },
      })
    })

    if (!user) {
      throw new NonRetriableError(`User not found with id: ${event.data.toUserId}`)
    }

    const preference = user.communicationPreferences.find(
      (cp) => cp.preferenceType.name === 'Newsletter' && cp.channel.name === 'Email',
    )

    if (!preference?.active) {
      return 'User has unsubscribed'
    }

    return await step.run('send the email', async () => {
      return await sendAnEmail<BasicEmailProps>({
        Component: BasicEmail,
        componentProps: {
          body: `hi`,
          preview: `hi there guy`,
          unsubscribeLinkUrl: `${env.NEXT_PUBLIC_URL}unsubscribed?userId=${user.id}`,
          messageType: 'broadcast',
        },
        Subject: 'Course Builder Test',
        To: user.email,
        type: 'broadcast',
        unsubscribeLinkUrl: `${env.NEXT_PUBLIC_URL}unsubscribed?userId=${user.id}`,
      })
    })
  },
)
