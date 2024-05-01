import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'

export async function getModuleProgressForUser(moduleIdOrSlug: string) {
	const { session } = await getServerAuthSession()
	if (!session) {
		return []
	}

	const moduleProgress = await courseBuilderAdapter.getModuleProgressForUser(
		session.user.id,
		moduleIdOrSlug,
	)
	return moduleProgress
}
