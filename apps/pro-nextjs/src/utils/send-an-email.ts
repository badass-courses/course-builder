import { env } from '@/env.mjs'
import { render } from '@react-email/render'

export async function sendAnEmail<ComponentPropsType = any>({
	Component,
	componentProps,
	Subject,
	To,
	ReplyTo,
	From = `${env.NEXT_PUBLIC_SITE_TITLE} <${env.NEXT_PUBLIC_SUPPORT_EMAIL}>`,
	type = 'transactional',
}: {
	Component: (props: ComponentPropsType) => React.JSX.Element
	componentProps: ComponentPropsType
	Subject: string
	From?: string
	ReplyTo?: string
	To: string
	type?: 'transactional' | 'broadcast'
}) {
	const emailHtml = render(Component(componentProps))

	const MessageStream = type === 'broadcast' ? 'broadcast' : 'outbound'

	const options = {
		From,
		To,
		Subject,
		ReplyTo,
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
