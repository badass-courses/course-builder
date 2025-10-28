import z from 'zod'

export type Subscriber = any

export type QuizResource = {
	title?: string
	slug?: string
	questions: QuestionSet
}

export const SurveyQuestionTypeSchema = z.enum([
	'multiple-choice',
	'essay',
	'multiple-image-choice',
])
export type SurveyQuestionType = z.infer<typeof SurveyQuestionTypeSchema>

export const ChoiceSchema = z.object({
	answer: z.string(),
	label: z.string().optional(),
	image: z.string().optional(),
})
export type Choice = z.infer<typeof ChoiceSchema>

export const QuestionResourceSchema = z.object({
	question: z.union([z.string(), z.function().returns(z.string())]),
	type: SurveyQuestionTypeSchema,
	tagId: z.number().optional(),
	correct: z.union([z.array(z.string()), z.string()]).optional(),
	answer: z.string().optional(),
	choices: z.array(ChoiceSchema).optional(),
	template: z.string().optional(),
	shuffleChoices: z.boolean().optional(),
	allowMultiple: z.boolean().optional(),
	required: z.boolean().optional(),
	dependsOn: z
		.object({
			question: z.string(),
			answer: z.string(),
		})
		.optional(),
	code: z
		.array(
			z.object({
				filename: z.string(),
				active: z.boolean(),
				code: z.string(),
			}),
		)
		.optional(),
})
export type QuestionResource = z.infer<typeof QuestionResourceSchema>

export const QuestionSetSchema = z.record(z.string(), QuestionResourceSchema)

export type QuestionSet = z.infer<typeof QuestionSetSchema>

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
	type: SurveyQuestionType
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

export type SurveyConfig = {
	afterCompletionMessages: {
		askForEmail: {
			title: string
			description: string
		}
		neutral: {
			default: string
			last: string
		}
		correct: {
			default: string
			last: string
		}
		incorrect: {
			default: string
			last: string
		}
	}
	questionBodyRenderer: ((question: any) => React.ReactNode) | undefined
}
