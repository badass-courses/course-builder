/**
 * Sends an email using Postmark API with React components as email templates
 *
 * This utility function renders a React component as an HTML email and sends it
 * through the Postmark API. It supports both transactional and broadcast message
 * streams, and allows customization of email headers like From, To, Subject, and ReplyTo.
 *
 * @param options - Email options configuration object
 * @param options.Component - React component to use as the email template
 * @param options.componentProps - Props to pass to the email template component
 * @param options.Subject - Email subject line
 * @param options.To - Recipient email address(es)
 * @param options.ReplyTo - Optional reply-to email address
 * @param options.From - Optional sender email (defaults to site title and support email)
 * @param options.type - Message stream type: 'transactional' (default) or 'broadcast'
 *
 * @returns Promise that resolves to the Postmark API response or the options object if SKIP_EMAIL is set
 *
 * @example
 * ```tsx
 * import { WelcomeEmail } from '@/emails/welcome-email'
 * import { sendAnEmail } from '@coursebuilder/utils-email/send-an-email'
 *
 * // Send a welcome email
 * const response = await sendAnEmail({
 *   Component: WelcomeEmail,
 *   componentProps: { userName: 'John', activationLink: 'https://example.com/activate' },
 *   Subject: 'Welcome to Our Service',
 *   To: 'user@example.com',
 *   ReplyTo: 'support@example.com'
 * })
 * ```
 */
export async function sendAnEmail<ComponentPropsType = any>({
	Component,
	componentProps,
	Subject,
	To,
	ReplyTo,
	From,
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
	// Import dependencies
	const { render } = await import('@react-email/render')

	// The email html needs to be rendered from the React component
	const emailHtml = render(Component(componentProps))

	// Determine the message stream based on the type
	const MessageStream = type === 'broadcast' ? 'broadcast' : 'outbound'

	// Get environment variables for default email configuration
	const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE
	const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL
	const skipEmail = process.env.SKIP_EMAIL
	const postmarkApiKey = process.env.POSTMARK_API_KEY

	// Default From value should be configurable by the consumer app
	const defaultFrom =
		siteTitle && supportEmail ? `${siteTitle} <${supportEmail}>` : undefined

	// Set up email options
	const options = {
		From: From || defaultFrom,
		To,
		Subject,
		ReplyTo,
		HtmlBody: emailHtml,
		MessageStream,
	}

	// Skip sending email if SKIP_EMAIL environment variable is set
	if (skipEmail === 'true') {
		console.log('SKIP_EMAIL is set, skipping email')
		return options
	}

	// Check if POSTMARK_API_KEY is available
	if (!postmarkApiKey) {
		throw new Error('POSTMARK_API_KEY environment variable is not set')
	}

	// Send the email via Postmark API
	return await fetch(`https://api.postmarkapp.com/email`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Postmark-Server-Token': postmarkApiKey,
		},
		body: JSON.stringify(options),
	}).then((res) => res.json())
}
