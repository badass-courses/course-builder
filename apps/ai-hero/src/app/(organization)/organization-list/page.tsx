import { headers } from 'next/headers'
import Link from 'next/link'
import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function OrganizationList() {
	const { session } = await getServerAuthSession()
	const headersList = await headers()

	const currentOrganization = headersList.get('x-organization-id')

	if (!session?.user) {
		return <div>You must be logged in to view this page</div>
	}

	const organizationMemberships =
		await courseBuilderAdapter.getMembershipsForUser(session.user.id)

	return (
		<div className="container mx-auto space-y-6 py-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{organizationMemberships.map((membership) => (
					<Card key={membership.organizationId} className="block">
						<CardHeader>
							<CardTitle>
								{membership.organization.name || 'Unnamed Organization'}
							</CardTitle>
							<CardDescription>Role: {membership.role}</CardDescription>
						</CardHeader>
						{currentOrganization === membership.organizationId ? (
							<CardContent>
								<p className="text-muted-foreground text-sm">
									Current organization
								</p>
							</CardContent>
						) : (
							<CardContent>
								<Button>Switch to this organization</Button>
							</CardContent>
						)}
					</Card>
				))}
			</div>
		</div>
	)
}
