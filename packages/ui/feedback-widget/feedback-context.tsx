'use client'

import React from 'react'

import FeedbackDialog from './feedback-dialog'

export type FeedbackContextType = {
	isFeedbackDialogOpen: boolean
	setIsFeedbackDialogOpen: (value: boolean, location?: string) => void
	feedbackComponent: React.ReactElement | null
	location: string
}

const defaultFeedbackContext: FeedbackContextType = {
	isFeedbackDialogOpen: true,
	setIsFeedbackDialogOpen: () => {},
	feedbackComponent: <></>,
	location: '',
}

export function useFeedback() {
	return React.useContext(FeedbackContext)
}

export const FeedbackContext = React.createContext(defaultFeedbackContext)

export const FeedbackProvider: React.FC<
	React.PropsWithChildren<{
		feedbackComponent?: React.ReactElement
	}>
> = ({ children, feedbackComponent = <FeedbackDialog /> }) => {
	const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] =
		React.useState<boolean>(false)
	const [location, setLocation] = React.useState<string>('navigation')

	return (
		<FeedbackContext.Provider
			value={{
				isFeedbackDialogOpen,
				setIsFeedbackDialogOpen: (value, location) => {
					location && setLocation(location)
					setIsFeedbackDialogOpen(value)
				},
				feedbackComponent: isFeedbackDialogOpen ? feedbackComponent : null,
				location,
			}}
		>
			{children}
		</FeedbackContext.Provider>
	)
}
