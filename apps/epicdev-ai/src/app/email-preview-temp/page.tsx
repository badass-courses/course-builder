import LiveOfficeHoursInvitation from '@/emails/live-office-hours'
import type { OfficeHoursDay } from '@/emails/utils/live-office-hours'
import { liveOfficeHoursEmailProps } from '@/inngest/functions/send-office-hours-for-cohort'
import { render } from '@react-email/render'

export default async function EmailPreviewPage() {
	// Sample data matching the structure from the workflow

	const emailProps = {
		eventTitle: liveOfficeHoursEmailProps.eventTitle,
		eventDate: liveOfficeHoursEmailProps.eventDate,
		days: liveOfficeHoursEmailProps.days,
		userFirstName: 'Sarah',
		messageType: 'transactional' as const,
	}

	const emailHtml = await render(<LiveOfficeHoursInvitation {...emailProps} />)

	return (
		<div
			style={{
				maxWidth: '100%',
				margin: '0 auto',
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<div
				style={{
					padding: '20px',
					backgroundColor: '#f3f4f6',
					borderBottom: '1px solid #e5e7eb',
				}}
			>
				<h1
					style={{
						fontSize: '24px',
						fontWeight: 'bold',
						margin: 0,
						marginBottom: '8px',
					}}
				>
					Email Preview - Live Office Hours Invitation
				</h1>
				<p
					style={{
						fontSize: '14px',
						color: '#6b7280',
						margin: 0,
					}}
				>
					This is a temporary preview page for the office hours email
				</p>
			</div>
			<iframe
				srcDoc={emailHtml}
				style={{
					width: '100%',
					flex: 1,
					border: 'none',
					backgroundColor: '#f6f9fc',
				}}
				title="Email Preview"
			/>
		</div>
	)
}
