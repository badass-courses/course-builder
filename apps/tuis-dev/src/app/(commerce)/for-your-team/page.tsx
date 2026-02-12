import LayoutClient from '@/components/layout-client'
import { TeamInquiryForm } from '@/components/team-inquiry/team-inquiry-form'

export default function TeamPage() {
	return (
		<LayoutClient withContainer>
			<div className="container mx-auto px-5 py-16 md:py-24">
				<div className="mx-auto max-w-4xl">
					<div className="mb-16 text-center">
						<h1 className="mb-4 text-4xl font-bold md:text-5xl">
							Code with Antonio for Teams
						</h1>
						<p className="text-muted-foreground mx-auto max-w-2xl text-lg">
							Empower your entire team with Antonio. Get custom pricing,
							dedicated support, and enterprise features tailored to your
							organization's needs.
						</p>
					</div>

					<div className="bg-card shadow-xs rounded-lg border p-6 md:p-10">
						<h2 className="mb-6 text-2xl font-semibold">Get in Touch</h2>
						<TeamInquiryForm location="/for-your-team" />
					</div>
				</div>
			</div>
		</LayoutClient>
	)
}
