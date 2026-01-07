import { headers } from 'next/headers'
import Link from 'next/link'
import LayoutClient from '@/components/layout-client'
import { courseBuilderAdapter, db } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { inArray } from 'drizzle-orm'

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

import OrgSwitch, { CurrentOrgSwitch } from '../_components/org-switch'

export default async function OrganizationList() {
	const { session } = await getServerAuthSession()
	const headersList = await headers()
	const currentOrganization = headersList.get('x-organization-id')

	if (!session?.user) {
		return <div>You must be logged in to view this page</div>
	}

	const organizationMemberships =
		await courseBuilderAdapter.getMembershipsForUser(session.user.id)

	const organizationMembershipRoles =
		await db.query.organizationMembershipRoles.findMany({
			where: (omr, { eq }) =>
				inArray(
					omr.organizationMembershipId,
					organizationMemberships.map((m) => m.id),
				),
			with: {
				role: true,
			},
		})

	// Helper to get role names for a membership
	const getRoleNames = (membershipId: string) => {
		const membershipRoles = organizationMembershipRoles.filter(
			(omr) => omr.organizationMembershipId === membershipId,
		)
		return membershipRoles.map((omr) => omr.role.name)
	}

	return (
		<LayoutClient withContainer>
			<div className="container relative mx-auto flex min-h-[calc(100vh-var(--nav-height))] w-full grow flex-col items-center justify-start px-5 pb-10 pt-16 sm:px-8">
				<div className="mb-16 flex flex-col gap-2">
					<h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
				</div>
				<div className="flex w-full flex-row flex-wrap justify-center gap-5">
					{organizationMemberships.map((membership) => {
						const roleNames = getRoleNames(membership.id)
						const roleDisplay =
							roleNames.length > 0
								? roleNames.join(', ')
								: membership.role || 'user'

						const orgDisplayName =
							roleDisplay === 'learner'
								? membership.organization.name?.replace('Personal', 'Team')
								: membership.organization.name

						return (
							<Card
								key={membership.organizationId}
								className="flex w-full max-w-lg flex-col justify-between"
							>
								<CardHeader>
									{/* <pre>{JSON.stringify(membership, null, 2)}</pre> */}
									<CardTitle className="text-xl font-semibold">
										{orgDisplayName || 'Unnamed Organization'}
									</CardTitle>
									<CardDescription className="text-foreground text-base">
										Role: {roleDisplay}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{/* <p className="text-muted-foreground text-sm">
									{membership.organizationId}
								</p>
								<p className="text-muted-foreground text-sm">
									{membership.organization.createdAt.toLocaleDateString()}
									{membership.organization.createdAt.toLocaleTimeString()}
								</p> */}
									{currentOrganization !== membership.organizationId &&
									membership.organizationId ? (
										<OrgSwitch organizationId={membership.organizationId} />
									) : (
										<CurrentOrgSwitch />
									)}
								</CardContent>
							</Card>
						)
					})}
				</div>
			</div>
		</LayoutClient>
	)
}
