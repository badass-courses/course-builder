import * as React from 'react'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMachine } from '@xstate/react'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import { useForm, UseFormReturn } from 'react-hook-form'
import Markdown from 'react-markdown'
import { SnapshotFrom } from 'xstate'
import { z } from 'zod'

import {
	Button,
	Checkbox,
	Input,
	Label,
	RadioGroup,
	RadioGroupItem,
	Textarea,
} from '@coursebuilder/ui'
import Spinner from '@coursebuilder/ui/primitives/spinner'

import {
	surveyMachine,
	SurveyMachineContext,
	SurveyMachineEvent,
} from './survey-machine'
import { Choice, QuestionResource, SurveyConfig } from './types'

export type FormValues = {
	answer: string | string[] | null
}

type InternalQuestionContextValue = {
	questionId: string
	form: UseFormReturn<FormValues>
	surveyMachineState: SnapshotFrom<typeof surveyMachine>
} & SurveyQuestionProps

/**
 * Props for the SurveyQuestion component
 */
type SurveyQuestionProps = {
	config: SurveyConfig
	currentQuestion: QuestionResource
	currentQuestionId: string
	isLast?: boolean
	currentAnswer?: string | string[]
	syntaxHighlighterTheme?: any
	questionBodyRenderer?: any
	handleSubmitAnswer: (context: SurveyMachineContext) => Promise<any>
	children?: React.ReactNode
	className?: string
	id?: string
}

const SurveyQuestionContext = React.createContext<
	InternalQuestionContextValue | undefined
>(undefined)

const useSurveyQuestion = () => {
	const context = React.useContext(SurveyQuestionContext)
	if (!context) {
		throw new Error('useSurveyQuestion must be used within SurveyQuestion')
	}
	return context
}

/**
 * Main survey question component that manages the question state and form
 */
export function SurveyQuestion({
	children,
	className = '',
	id: providedId,
	...props
}: SurveyQuestionProps) {
	const generatedId = React.useId()
	const id = providedId || generatedId
	const [surveyMachineState, sentToSurveyMachine] = useMachine(surveyMachine, {
		input: props,
	})
	const hasMultipleCorrectAnswers = isArray(props.currentQuestion.correct)
	const { currentQuestion, currentQuestionId } = props

	React.useEffect(() => {
		if (currentQuestion) {
			sentToSurveyMachine({
				type: 'LOAD_QUESTION',
				currentQuestion,
				currentQuestionId,
			})
		}
	}, [currentQuestion, currentQuestionId, sentToSurveyMachine])

	// Create validation schema
	const createValidationSchema = () => {
		const hasCorrect = props.currentQuestion.correct
		const allowMultiple = props.currentQuestion.allowMultiple
		const isRequired = props.currentQuestion.required

		if (hasCorrect || allowMultiple) {
			if (hasMultipleCorrectAnswers || allowMultiple) {
				return z.object({
					answer: z
						.array(z.string())
						.min(1, 'Pick at least one option.')
						.nullable(),
				})
			} else {
				return z.object({
					answer: z.string({ required_error: 'Pick an option.' }).nullable(),
				})
			}
		} else if (isRequired) {
			return z.object({
				answer: z
					.string()
					.min(1, "Can't stay empty. Please elaborate!")
					.nullable(),
			})
		}
		return z.object({
			answer: z.string().nullable().optional(),
		})
	}

	const form = useForm<FormValues>({
		resolver: zodResolver(createValidationSchema()),
		defaultValues: { answer: null },
		mode: 'onChange',
	})

	const onSubmit = async (values: FormValues) => {
		console.log('form on submit', values)
		sentToSurveyMachine({
			type: 'ANSWER',
			answer: values.answer ?? '',
		})
	}

	const context: InternalQuestionContextValue = {
		questionId: id,
		form,
		surveyMachineState,
		...props,
		currentQuestion: surveyMachineState.context.currentQuestion,
	}

	return (
		<SurveyQuestionContext.Provider value={context}>
			<form
				className={className}
				onSubmit={form.handleSubmit(onSubmit)}
				data-sr-quiz-question=""
			>
				{children}
			</form>
		</SurveyQuestionContext.Provider>
	)
}

/**
 * Header component for displaying the question text
 */
export function SurveyQuestionHeader({
	children,
	...props
}: React.ComponentPropsWithoutRef<'legend'>) {
	const { currentQuestion, config, surveyMachineState } = useSurveyQuestion()

	const answers = surveyMachineState.context.allAnswers
	const { questionBodyRenderer } = config

	return (
		<legend {...props} data-sr-quiz-question-header="">
			{children}
			{questionBodyRenderer ? (
				questionBodyRenderer(currentQuestion?.question)
			) : (
				<Markdown>
					{typeof currentQuestion?.question === 'function'
						? currentQuestion.question(answers)
						: currentQuestion?.question}
				</Markdown>
			)}
		</legend>
	)
}

type SurveyQuestionChoicesProps = React.ComponentPropsWithoutRef<'ul'> & {
	grid?: boolean
}

/**
 * Container component for rendering multiple choice options
 */
export function SurveyQuestionChoices({
	children,
	grid = false,
	...props
}: SurveyQuestionChoicesProps) {
	const {
		surveyMachineState,
		form: {
			formState: { errors },
			setValue,
			watch,
		},
		currentAnswer,
	} = useSurveyQuestion()

	const currentQuestion = surveyMachineState.context.currentQuestion
	const currentValue = watch('answer')
	const hasMultipleCorrectAnswers =
		isArray(currentQuestion.correct) || currentQuestion.allowMultiple
	const isAnswered = surveyMachineState.matches('answered')

	return (
		<div data-sr-quiz-question-choices-wrapper="">
			<ul {...props} data-sr-quiz-question-choices="">
				{children}
				{hasMultipleCorrectAnswers ? (
					currentQuestion?.choices?.map((choice: Choice, i: number) => {
						return (
							<SurveyQuestionChoice
								key={choice.answer}
								choice={choice}
								index={i}
							/>
						)
					})
				) : (
					<RadioGroup
						value={currentValue as string}
						onValueChange={(value) =>
							setValue('answer', value, {
								shouldValidate: true,
								shouldDirty: true,
							})
						}
						disabled={isAnswered}
					>
						{currentQuestion?.choices?.map((choice: Choice, i: number) => {
							return (
								<SurveyQuestionChoice
									key={choice.answer}
									choice={choice}
									index={i}
								/>
							)
						})}
					</RadioGroup>
				)}
				{errors?.answer && (
					<div data-sr-quiz-question-error="">
						{errors.answer.message as string}
					</div>
				)}
			</ul>
		</div>
	)
}

type SurveyQuestionChoiceProps = React.ComponentPropsWithoutRef<'li'> & {
	choice: Choice
	index: number
}

/**
 * Individual choice item component with radio or checkbox input
 */
export function SurveyQuestionChoice({
	children,
	choice,
	index,
	...props
}: SurveyQuestionChoiceProps) {
	const { surveyMachineState, form, currentAnswer, currentQuestion } =
		useSurveyQuestion()
	const isAnswered = surveyMachineState.matches('answered')
	const answer = surveyMachineState.context.answer
	const alpha = Array.from(Array(26)).map((_, i) => i + 65)
	const alphabet = alpha.map((x) => String.fromCharCode(x))

	const hasMultipleCorrectAnswers =
		isArray(currentQuestion.correct) || currentQuestion.allowMultiple
	const hasCorrectAnswer = !isEmpty(currentQuestion.correct)

	function isCorrectChoice(choice: Choice): boolean {
		return currentQuestion.correct && hasMultipleCorrectAnswers
			? (currentQuestion.correct as string[]).includes(choice.answer)
			: currentQuestion.correct === choice?.answer
	}

	const { register, watch, setValue } = form
	const currentValue = watch('answer')

	const choiceId = `choice-${choice.answer}-${index}`

	const handleCheckboxChange = (checked: boolean) => {
		const currentAnswers = isArray(currentValue) ? currentValue : []
		if (checked) {
			setValue('answer', [...currentAnswers, choice.answer], {
				shouldValidate: true,
				shouldDirty: true,
			})
		} else {
			setValue(
				'answer',
				currentAnswers.filter((a: string) => a !== choice.answer),
				{ shouldValidate: true, shouldDirty: true },
			)
		}
	}

	return (
		<li
			{...props}
			data-sr-quiz-question-choice={
				isAnswered && hasCorrectAnswer
					? isCorrectChoice(choice)
						? 'correct'
						: 'incorrect'
					: ''
			}
		>
			{choice.image && <img src={choice.image} alt={choice.answer} />}
			{hasMultipleCorrectAnswers ? (
				<Label>
					<Checkbox
						value={choice.answer}
						checked={
							isArray(currentValue)
								? currentValue.includes(choice.answer)
								: currentValue === choice.answer
						}
						onCheckedChange={handleCheckboxChange}
						disabled={isAnswered}
					/>
					<p>{choice.label || alphabet[index]}</p>
					{isAnswered && hasCorrectAnswer && (
						<span>{isCorrectChoice(choice) ? 'correct' : 'incorrect'}</span>
					)}
				</Label>
			) : (
				<div className="flex items-center gap-3">
					<RadioGroupItem value={choice.answer} id={choiceId} />
					<Label htmlFor={choiceId}>
						<p>{choice.label || alphabet[index]}</p>
						{isAnswered && hasCorrectAnswer && (
							<span>{isCorrectChoice(choice) ? 'correct' : 'incorrect'}</span>
						)}
					</Label>
				</div>
			)}
		</li>
	)
}

/**
 * Text input component for essay-style questions
 */
export function SurveyQuestionInput({
	children,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	const { surveyMachineState, form } = useSurveyQuestion()
	const {
		formState: { errors },
		register,
	} = form
	const isAnswered = surveyMachineState.matches('answered')

	return (
		<div {...props} data-sr-quiz-question-input={errors?.answer ? 'error' : ''}>
			<Label htmlFor="answer">Your answer</Label>
			<Textarea
				{...register('answer')}
				rows={6}
				id="answer"
				disabled={isAnswered}
				placeholder="Type your answer..."
			/>
			{errors?.answer && (
				<div data-sr-quiz-question-error="">
					{errors.answer.message as string}
				</div>
			)}
		</div>
	)
}

/**
 * Container for the question body content
 */
export function SurveyQuestionBody({
	children,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	return (
		<div {...props} data-sr-quiz-question-body="">
			{children}
		</div>
	)
}

/**
 * Component for displaying the answer/explanation after question is answered
 */
export function SurveyQuestionAnswer({
	children,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	const { surveyMachineState, currentQuestion, config } = useSurveyQuestion()
	const { questionBodyRenderer } = config
	const isAnswered = surveyMachineState.matches('answered')
	return isAnswered && currentQuestion.answer ? (
		<div {...props} data-sr-quiz-question-answer="">
			<>
				{questionBodyRenderer ? (
					questionBodyRenderer(currentQuestion.answer)
				) : (
					<Markdown>{currentQuestion.answer}</Markdown>
				)}
				{children}
			</>
		</div>
	) : null
}

/**
 * Submit button component
 */
export function SurveyQuestionSubmit({
	children,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	const { surveyMachineState } = useSurveyQuestion()

	const isAnswered = surveyMachineState.matches('answered')
	const isSubmitting = surveyMachineState.matches('answering')

	return isAnswered ? null : (
		<div {...props} data-sr-quiz-question-submit="">
			<Button disabled={isAnswered || isSubmitting} type="submit">
				{isSubmitting ? (
					<>
						<Spinner className="h-4 w-4" />
						<span>Submitting...</span>
					</>
				) : (
					children
				)}
			</Button>
		</div>
	)
}

/**
 * Footer component that displays after-answer messages
 */
export function SurveyQuestionFooter({
	children,
	...props
}: React.ComponentPropsWithoutRef<'footer'>) {
	const { surveyMachineState, isLast, config } = useSurveyQuestion()
	const focusRef = React.useRef<HTMLDivElement>(null)
	const isAnswered = surveyMachineState.matches('answered')
	const answeredNeutral = surveyMachineState.matches('answered.neutral')
	const answeredCorrectly = surveyMachineState.matches('answered.correct')

	React.useEffect(() => {
		if (isAnswered && focusRef.current) {
			focusRef.current.focus()
		}
	}, [isAnswered])

	const { afterCompletionMessages } = config

	return isAnswered ? (
		<footer {...props} data-sr-quiz-question-footer="">
			<div ref={focusRef} tabIndex={-1}>
				<Markdown>
					{answeredNeutral
						? isLast
							? afterCompletionMessages.neutral.last
							: afterCompletionMessages.neutral.default
						: answeredCorrectly
							? isLast
								? afterCompletionMessages.correct.last
								: afterCompletionMessages.correct.default
							: isLast
								? afterCompletionMessages.incorrect.last
								: afterCompletionMessages.incorrect.default}
				</Markdown>
				{children}
			</div>
		</footer>
	) : null
}

/**
 * Essay-style textarea component for long-form text answers
 */
export function SurveyQuestionEssay({
	children,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	const { form, surveyMachineState } = useSurveyQuestion()
	const isAnswered = surveyMachineState.matches('answered')
	const {
		register,
		formState: { errors },
	} = form

	return (
		<div {...props} data-sr-quiz-question-essay="">
			<Textarea
				{...register('answer')}
				disabled={isAnswered}
				rows={6}
				className="w-full rounded border p-2"
				placeholder="Type your answer here..."
			/>
			{errors.answer && (
				<div className="text-red-500">{errors.answer.message as string}</div>
			)}
			{children}
		</div>
	)
}

type SurveyQuestionEmailProps = Omit<
	React.ComponentPropsWithoutRef<'div'>,
	'onSubmit'
> & {
	onSubmit: (email: string) => void
}

/**
 * Email capture component for survey completion
 */
export function SurveyQuestionEmail({
	onSubmit,
	...props
}: SurveyQuestionEmailProps) {
	const [email, setEmail] = useState('')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit(email)
	}

	return (
		<div {...props} data-sr-quiz-question-email="">
			<h2 className="mb-4 text-2xl font-bold">
				Thank you for completing the survey!
			</h2>
			<p className="mb-4">
				Please enter your email to receive updates and insights based on the
				survey results:
			</p>
			<form onSubmit={handleSubmit}>
				<Input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className="mb-4 w-full"
					placeholder="Your email"
				/>
				<Button type="submit" className="w-full">
					Submit
				</Button>
			</form>
		</div>
	)
}
