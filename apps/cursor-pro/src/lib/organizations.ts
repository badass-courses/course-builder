import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'

export async function getOrganizations() {
	const { session } = await getServerAuthSession()

	if (!session?.user?.id) {
		throw new Error('Not authenticated')
	}

	const memberships = await courseBuilderAdapter.getMembershipsForUser(
		session.user.id,
	)

	return memberships.map((membership) => ({
		id: membership.organizationId,
		name: membership.organization.name || 'Unnamed Organization',
		slug: membership.organization.fields?.slug || membership.organizationId,
	}))
}
