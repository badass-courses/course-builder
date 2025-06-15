'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export interface HeadingInfo {
	slug: string
	text: string
	level: number
}

interface ActiveHeadingContextType {
	activeHeading: HeadingInfo | null
	setActiveHeading: (heading: HeadingInfo | null) => void
}

const ActiveHeadingContext = createContext<ActiveHeadingContextType | null>(
	null,
)

export { ActiveHeadingContext }

interface ActiveHeadingProviderProps {
	children: ReactNode
}

export function ActiveHeadingProvider({
	children,
}: ActiveHeadingProviderProps) {
	const [activeHeading, setActiveHeading] = useState<HeadingInfo | null>(null)

	return (
		<ActiveHeadingContext.Provider
			value={{
				activeHeading,
				setActiveHeading,
			}}
		>
			{children}
		</ActiveHeadingContext.Provider>
	)
}

export function useActiveHeadingContext() {
	const context = useContext(ActiveHeadingContext)

	if (!context) {
		throw new Error(
			'useActiveHeadingContext must be used within an ActiveHeadingProvider',
		)
	}

	return context
}
