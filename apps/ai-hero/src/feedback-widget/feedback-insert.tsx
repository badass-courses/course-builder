'use client'

import * as React from 'react'
import { useFeedback } from '@/feedback-widget/feedback-context'

export function FeedbackInsert() {
	const { isFeedbackDialogOpen, feedbackComponent } = useFeedback()
	return <>{isFeedbackDialogOpen && feedbackComponent}</>
}
