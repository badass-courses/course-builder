export default function CheckYourEmailPage() {
	return (
		<div
			className="flex min-h-screen items-center justify-center"
			data-check-your-email
		>
			<div className="text-center" data-container>
				<h1 className="mb-4 text-3xl font-bold" data-title>
					Check your email
				</h1>
				<p className="mb-8 text-gray-600" data-message>
					We&apos;ve sent you a login link. Please check your email and click
					the link to sign in.
				</p>
				<p className="text-sm text-gray-500">
					If you don&apos;t see the email, check your spam folder or try again.
				</p>
			</div>
		</div>
	)
}
