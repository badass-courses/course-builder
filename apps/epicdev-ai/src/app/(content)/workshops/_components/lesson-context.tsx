'use client'

import * as React from 'react'
import { Lesson } from '@/lib/lessons'

// used to load the transcript and that's it
export const LessonContext = React.createContext<{
	lesson: Lesson | null
}>({ lesson: null })

export const LessonProvider = ({
	children,
	lesson,
}: {
	children: React.ReactNode
	lesson: Lesson | null
}) => {
	return (
		<LessonContext.Provider value={{ lesson }}>
			{children}
		</LessonContext.Provider>
	)
}
