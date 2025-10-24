export type Subscriber = any

export type QuizResource = {
	title?: string
	slug?: string
	questions: QuestionSet
}

export type QuestionResource = {
	question: string | ((answers: Record<string, string | string[]>) => string)
	type: 'multiple-choice' | 'multiple-image-choice' | 'essay' | 'code'
	tagId?: number
	correct?: string[] | string
	answer?: string
	choices?: Choice[]
	template?: string
	shuffleChoices?: boolean
	allowMultiple?: boolean
	required?: boolean
	dependsOn?: {
		question: string
		answer: string
	}
	code?: {
		filename: string
		active: boolean
		code: string
	}[]
}

export type QuestionSet = {
	[key: string]: QuestionResource
}

export type Choice = {
	answer: string
	label?: string
	image?: string
}

export type SurveyState = {
	subscriber?: Subscriber
	question?: SurveyQuestion
	data: any
	currentQuestionKey: string
	answers: any
	closed: boolean
	surveyTitle: string
}

export type SurveyQuestion = {
	heading: string
	subheading: string
	type:
		| 'opt-out'
		| 'cta-email'
		| 'cta-done'
		| 'multiple-choice'
		| 'multi-line'
		| 'cta-link'
	first?: boolean
	random?: boolean
	other?: boolean
	other_label?: string
	choices?: MultipleChoiceAnswer[]
	next?: any
	image?: string
	button_label?: string
	url?: string
	final?: boolean
}

export type MultipleChoiceAnswer = {
	answer: string
	label: string
	always_last?: boolean
}
export type Offer = Record<string, any>

export type Survey = Record<string, SurveyQuestion | string>
