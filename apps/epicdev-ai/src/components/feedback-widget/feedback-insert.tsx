'use client'

import * as React from 'react'

import { useFeedback } from '@coursebuilder/ui/feedback-widget'

export function FeedbackInsert() {
	const { isFeedbackDialogOpen, feedbackComponent } = useFeedback()
	return <>{isFeedbackDialogOpen && feedbackComponent}</>
}
