'use server'

import { cookies } from 'next/headers'
import type { Lesson } from '@/lib/lessons'
import { getServerAuthSession } from '@/server/auth'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'

import { cn } from '@coursebuilder/ui/utils/cn'

import { BingeModeToggle } from './binge-mode-toggle'
import { ModuleLessonProgressToggle } from './module-lesson-progress-toggle'

export const LessonControls = async ({
	lesson,
	className,
	moduleType = 'workshop',
}: {
	lesson: Lesson | null
	className?: string
	moduleType?: 'tutorial' | 'workshop'
}) => {
	const { session } = await getServerAuthSession()
	const cookieStore = cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	if (!lesson) {
		return null
	}

	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-5 text-sm font-normal',
				className,
			)}
		>
			<BingeModeToggle />
			{(session?.user || ckSubscriber) &&
			(lesson.type === 'lesson' || lesson.type === 'solution') ? (
				<ModuleLessonProgressToggle
					// if we are on solution, pass in exercise as lesson for completing
					lesson={lesson}
					moduleType={moduleType}
				/>
			) : null}
		</div>
	)
}
