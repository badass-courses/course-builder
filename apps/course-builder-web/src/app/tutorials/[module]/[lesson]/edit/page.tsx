import { notFound } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function EditTutorialLessonPage({
	params,
}: {
	params: { module: string; lesson: string }
}) {
	const { module, lesson } = params

	const { ability } = await getServerAuthSession()

	const lessonData = null

	if (!lessonData || !ability.can('update', 'Content')) {
		notFound()
	}

	return (
		<div className="flex flex-col">
			<div>Edit Tutorial Lesson Form</div>
		</div>
	)
}
