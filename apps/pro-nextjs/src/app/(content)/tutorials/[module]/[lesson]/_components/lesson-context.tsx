'use client'

import * as React from 'react'
import { Lesson } from '@/lib/lessons'

// used to load the transcript and that's it
export const LessonContext = React.createContext<{
	lesson: Lesson | null
}>({ lesson: null })

export const LessonProvider = ({
	children,
	lessonLoader,
}: {
	children: React.ReactNode
	lessonLoader: Promise<Lesson | null>
}) => {
	const lesson = React.use(lessonLoader)
	return (
		<LessonContext.Provider value={{ lesson }}>
			{children}
		</LessonContext.Provider>
	)
}
