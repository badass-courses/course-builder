import * as React from 'react'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Slot } from '@radix-ui/react-slot'
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
import { cn } from '@coursebuilder/ui/utils/cn'

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
 * Root survey question component that manages question state and form.
 * Renders as a form element by default.
 *
 * @param asChild - If true, merges props into immediate child instead of rendering form
 */
export function SurveyQuestion({
	children,
	className,
	asChild,
	id: providedId,
	...props
}: SurveyQuestionProps & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'form'
	const generatedId = React.useId()
	const id = providedId || generatedId
	const [surveyMachineState, sentToSurveyMachine] = useMachine(surveyMachine, {
		input: props,
	})
	const hasMultipleCorrectAnswers = isArray(props.currentQuestion.correct)
	const { currentQuestion, currentQuestionId } = props

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

	React.useEffect(() => {
		if (currentQuestion) {
			// Get saved answer for this question from allAnswers or use default
			const savedAnswer =
				surveyMachineState.context.allAnswers?.[currentQuestionId]
			const hasMultiple =
				isArray(currentQuestion.correct) || currentQuestion.allowMultiple
			const defaultValue = savedAnswer ?? (hasMultiple ? [] : null)

			// Reset form with appropriate default value before loading new question
			form.reset({ answer: defaultValue })

			sentToSurveyMachine({
				type: 'LOAD_QUESTION',
				currentQuestion,
				currentQuestionId,
			})
		}
	}, [
		currentQuestion,
		currentQuestionId,
		sentToSurveyMachine,
		surveyMachineState.context.allAnswers,
		form,
	])

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
			<Comp
				className={cn('', className)}
				onSubmit={asChild ? undefined : form.handleSubmit(onSubmit)}
				data-sr-quiz-question=""
			>
				{children}
			</Comp>
		</SurveyQuestionContext.Provider>
	)
}

/**
 * Header component for displaying the question text.
 * Renders as a legend element by default with Markdown support.
 *
 * @param asChild - If true, merges props into immediate child
 * @param children - Fully overrides default question rendering when provided
 */
export function SurveyQuestionHeader({
	children,
	className,
	asChild,
	...props
}: React.ComponentPropsWithoutRef<'legend'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'legend'
	const { currentQuestion, config, surveyMachineState } = useSurveyQuestion()

	const answers = surveyMachineState.context.allAnswers
	const { questionBodyRenderer } = config

	return (
		<Comp
			className={cn('', className)}
			data-sr-quiz-question-header=""
			{...props}
		>
			{children ||
				(questionBodyRenderer ? (
					questionBodyRenderer(currentQuestion?.question)
				) : (
					<Markdown>
						{typeof currentQuestion?.question === 'function'
							? currentQuestion.question(answers)
							: currentQuestion?.question}
					</Markdown>
				))}
		</Comp>
	)
}

type SurveyQuestionChoicesProps = React.ComponentPropsWithoutRef<'div'> & {
	grid?: boolean
	asChild?: boolean
}

/**
 * Container component for rendering multiple choice options.
 * Automatically renders RadioGroup for single-choice or Checkboxes for multi-choice.
 *
 * @param asChild - If true, merges props into immediate child
 * @param children - Fully overrides default choice rendering when provided
 */
export function SurveyQuestionChoices({
	children,
	className,
	asChild,
	grid = false,
	...props
}: SurveyQuestionChoicesProps) {
	const Comp = asChild ? Slot : 'div'
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
		<Comp data-sr-quiz-question-choices-wrapper="" {...props}>
			{
				<>
					<ul data-sr-quiz-question-choices="" className={cn('', className)}>
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
					</ul>
					{errors?.answer && (
						<div data-sr-quiz-question-error="" className="mt-3">
							{errors.answer.message as string}
						</div>
					)}
				</>
			}
		</Comp>
	)
}

type SurveyQuestionChoiceProps = React.ComponentPropsWithoutRef<'li'> & {
	choice: Choice
	index: number
	asChild?: boolean
}

/**
 * Individual choice item component with radio or checkbox input.
 * Renders default label/input structure but can be fully customized.
 *
 * @param asChild - If true, merges props into immediate child
 * @param children - Fully overrides default choice rendering when provided
 */
export function SurveyQuestionChoice({
	children,
	className,
	asChild,
	choice,
	index,
	...props
}: SurveyQuestionChoiceProps) {
	const Comp = asChild ? Slot : 'li'
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
		<Comp
			className={cn('', className)}
			data-sr-quiz-question-choice={
				isAnswered && hasCorrectAnswer
					? isCorrectChoice(choice)
						? 'correct'
						: 'incorrect'
					: ''
			}
			{...props}
		>
			{children || (
				<>
					{choice.image && <img src={choice.image} alt={choice.answer} />}
					{hasMultipleCorrectAnswers ? (
						<Label className={cn('flex items-center gap-2')}>
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
							<span>{choice.label || alphabet[index]}</span>
							{isAnswered && hasCorrectAnswer && (
								<span className={cn('text-sm opacity-75')}>
									{isCorrectChoice(choice) ? 'correct' : 'incorrect'}
								</span>
							)}
						</Label>
					) : (
						<div className={cn('flex items-center gap-2')}>
							<RadioGroupItem value={choice.answer} id={choiceId} />
							<Label
								htmlFor={choiceId}
								className={cn('flex items-center gap-2')}
							>
								<span>{choice.label || alphabet[index]}</span>
								{isAnswered && hasCorrectAnswer && (
									<span className={cn('text-sm opacity-75')}>
										{isCorrectChoice(choice) ? 'correct' : 'incorrect'}
									</span>
								)}
							</Label>
						</div>
					)}
				</>
			)}
		</Comp>
	)
}

/**
 * Text input component for essay-style questions.
 * Renders Label and Textarea by default.
 *
 * @param asChild - If true, merges props into immediate child
 * @param children - Fully overrides default input rendering when provided
 */
export function SurveyQuestionInput({
	children,
	className,
	asChild,
	...props
}: React.ComponentPropsWithoutRef<'div'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'div'
	const { surveyMachineState, form } = useSurveyQuestion()
	const {
		formState: { errors },
		register,
	} = form
	const isAnswered = surveyMachineState.matches('answered')

	return (
		<Comp
			className={cn('', className)}
			data-sr-quiz-question-input={errors?.answer ? 'error' : ''}
			{...props}
		>
			{children || (
				<>
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
				</>
			)}
		</Comp>
	)
}

/**
 * Container for the question body content.
 * Renders as a div by default.
 *
 * @param asChild - If true, merges props into immediate child
 */
export function SurveyQuestionBody({
	children,
	className,
	asChild,
	...props
}: React.ComponentPropsWithoutRef<'div'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'div'
	return (
		<Comp
			className={cn('', className)}
			data-sr-quiz-question-body=""
			{...props}
		>
			{children}
		</Comp>
	)
}

/**
 * Component for displaying the answer/explanation after question is answered.
 * Only renders when question is in 'answered' state.
 *
 * @param asChild - If true, merges props into immediate child
 * @param children - Fully overrides default answer rendering when provided
 */
export function SurveyQuestionAnswer({
	children,
	className,
	asChild,
	...props
}: React.ComponentPropsWithoutRef<'div'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'div'
	const { surveyMachineState, currentQuestion, config } = useSurveyQuestion()
	const { questionBodyRenderer } = config
	const isAnswered = surveyMachineState.matches('answered')
	return isAnswered && currentQuestion.answer ? (
		<Comp
			className={cn('', className)}
			data-sr-quiz-question-answer=""
			{...props}
		>
			{children ||
				(questionBodyRenderer ? (
					questionBodyRenderer(currentQuestion.answer)
				) : (
					<Markdown>{currentQuestion.answer}</Markdown>
				))}
		</Comp>
	) : null
}

/**
 * Submit button component.
 * Hides when question is answered. Shows spinner during submission.
 *
 * @param asChild - If true, merges props into immediate child instead of rendering default Button
 * @param children - Button content, defaults to "Submit"
 */
export function SurveyQuestionSubmit({
	children,
	className,
	asChild,
	...props
}: React.ComponentPropsWithoutRef<'button'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : Button
	const { surveyMachineState } = useSurveyQuestion()

	const isAnswered = surveyMachineState.matches('answered')
	const isSubmitting = surveyMachineState.matches('answering')

	return isAnswered ? null : (
		<Comp
			className={cn('', className)}
			disabled={isAnswered || isSubmitting}
			type="submit"
			data-sr-quiz-question-submit=""
			{...props}
		>
			{children ||
				(isSubmitting ? (
					<>
						<Spinner className="h-4 w-4" />
						<span>Submitting...</span>
					</>
				) : (
					'Submit'
				))}
		</Comp>
	)
}

/**
 * Footer component that displays after-answer messages.
 * Only renders when question is in 'answered' state.
 *
 * @param asChild - If true, merges props into immediate child
 * @param children - Fully overrides default message rendering when provided
 */
export function SurveyQuestionFooter({
	children,
	className,
	asChild,
	...props
}: React.ComponentPropsWithoutRef<'footer'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'footer'
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
		<Comp
			className={cn('', className)}
			data-sr-quiz-question-footer=""
			{...props}
		>
			<div ref={focusRef} tabIndex={-1}>
				{children || (
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
				)}
			</div>
		</Comp>
	) : null
}

/**
 * Essay-style textarea component for long-form text answers.
 * Renders Textarea with minimal styling by default.
 *
 * @param asChild - If true, merges props into immediate child
 * @param children - Fully overrides default textarea rendering when provided
 */
export function SurveyQuestionEssay({
	children,
	className,
	asChild,
	...props
}: React.ComponentPropsWithoutRef<'div'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'div'
	const { form, surveyMachineState } = useSurveyQuestion()
	const isAnswered = surveyMachineState.matches('answered')
	const {
		register,
		formState: { errors },
	} = form

	return (
		<Comp
			className={cn('', className)}
			data-sr-quiz-question-essay=""
			{...props}
		>
			{children || (
				<>
					<Textarea
						{...register('answer')}
						disabled={isAnswered}
						rows={6}
						placeholder="Type your answer here..."
					/>
					{errors.answer && (
						<div data-sr-quiz-question-error="">
							{errors.answer.message as string}
						</div>
					)}
				</>
			)}
		</Comp>
	)
}

type SurveyQuestionEmailProps = Omit<
	React.ComponentPropsWithoutRef<'div'>,
	'onSubmit'
> & {
	onSubmit: (email: string) => void
	asChild?: boolean
	children?: React.ReactNode
}

/**
 * Email capture component for survey completion.
 * Renders a form with email input and submit button by default.
 *
 * @param asChild - If true, merges props into immediate child
 * @param children - Fully overrides default email form when provided
 * @param onSubmit - Callback fired with email value when form is submitted
 */
export function SurveyQuestionEmail({
	onSubmit,
	children,
	className,
	asChild,
	...props
}: SurveyQuestionEmailProps) {
	const Comp = asChild ? Slot : 'div'
	const [email, setEmail] = useState('')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit(email)
	}

	return (
		<Comp
			className={cn('', className)}
			data-sr-quiz-question-email=""
			{...props}
		>
			{children || (
				<>
					<h2 className={cn('text-2xl font-semibold')}>
						Thank you for completing the survey!
					</h2>
					<p className={cn('mt-2')}>
						Please enter your email to receive updates and insights based on the
						survey results:
					</p>
					<form onSubmit={handleSubmit} className={cn('mt-4')}>
						<Input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="Your email"
						/>
						<Button type="submit" className={cn('mt-4')}>
							Submit
						</Button>
					</form>
				</>
			)}
		</Comp>
	)
}

export {
	SurveyQuestion as Root,
	SurveyQuestionHeader as Header,
	SurveyQuestionBody as Body,
	SurveyQuestionChoices as Choices,
	SurveyQuestionChoice as Choice,
	SurveyQuestionInput as Input,
	SurveyQuestionEssay as Essay,
	SurveyQuestionAnswer as Answer,
	SurveyQuestionSubmit as Submit,
	SurveyQuestionFooter as Footer,
	SurveyQuestionEmail as Email,
}
