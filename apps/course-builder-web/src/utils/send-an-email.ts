import {render} from '@react-email/render'
import {env} from '@/env.mjs'

export async function sendAnEmail<ComponentPropsType = any>({
  Component,
  componentProps,
  Subject,
  To,
  From = `joel <joel@coursebuilder.dev>`,
  type = 'transactional',
}: {
  Component: (props: ComponentPropsType) => React.JSX.Element
  componentProps: ComponentPropsType
  Subject: string
  From?: string
  To: string
  type?: 'transactional' | 'broadcast'
}) {
  const emailHtml = render(Component(componentProps))

  const MessageStream = type === 'broadcast' ? 'broadcast' : 'outbound'

  const options = {
    From,
    To,
    Subject,
    HtmlBody: emailHtml,
    MessageStream,
  }

  return await fetch(`https://api.postmarkapp.com/email`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': env.POSTMARK_API_KEY,
    },
    body: JSON.stringify(options),
  }).then((res) => res.json())
}
