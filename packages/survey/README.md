# @coursebuilder/survey

State-managed survey and quiz system built with XState v5 and React. Handles
multi-step surveys, conditional question flows, answer validation, and
subscriber eligibility.

## Features

- **XState-powered state machines** for predictable survey flow and offer
  management
- **Conditional question logic** with dependency-based question rendering
- **Answer validation** for quiz-style surveys with correct/incorrect feedback
- **Subscriber eligibility** with configurable nag protection (prevents
  over-surveying)
- **Multiple question types**: multiple-choice, essay, code snippets
- **Choice shuffling** for unbiased survey results
- **Composable React components** for flexible UI implementation
- **TypeScript-first** with full type safety

## Installation

```bash
pnpm add @coursebuilder/survey
```

## Architecture

### State Machines

**Survey Machine** (`surveyMachine`)

- Manages individual question state and answer submission
- States: `initializing` → `unanswered` → `answering` → `answered`
  (correct/incorrect/neutral)
- Handles answer validation against correct answers
- Supports dynamic questions (functions that receive previous answers)

**Offer Machine** (`offerMachine`)

- Manages multi-question survey flow and subscriber eligibility
- States: `loadingSubscriber` → `verifyingOfferEligibility` →
  `loadingCurrentOffer` → `presentingCurrentOffer` → `offerComplete`
- Enforces wait periods between surveys (default: 3 days)
- Supports anonymous survey takers via `canSurveyAnon` flag

### React Integration

Two hook patterns:

- `useSurveyPageOfferMachine` - Full-page survey with all questions
- `useSurveyPopupOfferMachine` - Modal/popup survey flow

## Usage

### Basic Survey Setup

```typescript
import {
	surveyMachine,
	SurveyQuestion,
	useSurveyPageOfferMachine,
} from '@coursebuilder/survey'

// Define your survey structure
const mySurvey = {
	title: 'Developer Survey',
	questions: {
		skill_level: {
			question: 'What is your skill level?',
			type: 'multiple-choice',
			choices: [
				{ answer: 'beginner', label: 'Beginner' },
				{ answer: 'intermediate', label: 'Intermediate' },
				{ answer: 'expert', label: 'Expert' },
			],
		},
		years_experience: {
			question: 'How many years of experience?',
			type: 'multiple-choice',
			dependsOn: {
				question: 'skill_level',
				answer: 'expert',
			},
			choices: [
				{ answer: '5-10', label: '5-10 years' },
				{ answer: '10+', label: '10+ years' },
			],
		},
		feedback: {
			question: 'Tell us more',
			type: 'essay',
			required: false,
		},
	},
}
```

### Using the Hook

```tsx
function SurveyPage() {
	const {
		currentQuestion,
		currentQuestionId,
		isLoading,
		isComplete,
		handleSubmitAnswer,
		sendToMachine,
		answers,
	} = useSurveyPageOfferMachine('my_survey_id', subscriber, loadingSubscriber)

	if (isLoading) return <div>Loading...</div>
	if (isComplete) return <div>Thanks for completing the survey!</div>

	return (
		<SurveyQuestion
			question={currentQuestion}
			questionId={currentQuestionId}
			handleSubmitAnswer={handleSubmitAnswer}
			onAnswered={() => sendToMachine({ type: 'RESPONDED_TO_OFFER' })}
		/>
	)
}
```

### Question Types

**Multiple Choice**

```typescript
{
  question: 'Pick one or more',
  type: 'multiple-choice',
  allowMultiple: true,  // Multiple selections
  shuffleChoices: true,  // Randomize order
  choices: [
    { answer: 'react', label: 'React' },
    { answer: 'vue', label: 'Vue' }
  ]
}
```

**Quiz with Validation**

```typescript
{
  question: 'What is 2+2?',
  type: 'multiple-choice',
  correct: '4',  // Single correct answer
  // or correct: ['4', 'four']  // Multiple correct answers
  choices: [
    { answer: '3', label: '3' },
    { answer: '4', label: '4' },
    { answer: '5', label: '5' }
  ]
}
```

**Dynamic Questions**

```typescript
{
  question: (answers: Record<string, string>) =>
    `You chose ${answers.skill_level}. Tell us more about that.`,
  type: 'essay'
}
```

**Code Snippets**

```typescript
{
  question: 'Review this code',
  type: 'code',
  code: [
    {
      filename: 'example.ts',
      active: true,
      code: 'const x: number = 42'
    }
  ]
}
```

### Conditional Questions

Use `dependsOn` to show questions based on previous answers:

```typescript
{
  question: 'How many developers on your team?',
  type: 'multiple-choice',
  dependsOn: {
    question: 'uses_at_work',
    answer: 'yes'
  },
  choices: [...]
}
```

### Composable Components

Build custom UIs with composable primitives:

```tsx
import {
	SurveyQuestion,
	SurveyQuestionBody,
	SurveyQuestionChoice,
	SurveyQuestionChoices,
	SurveyQuestionEssay,
	SurveyQuestionHeader,
	SurveyQuestionSubmit,
} from '@coursebuilder/survey'

return (
	<SurveyQuestion {...props}>
		<SurveyQuestionHeader />
		<SurveyQuestionBody>
			{question.type === 'essay' ? (
				<SurveyQuestionEssay />
			) : (
				<SurveyQuestionChoices>
					{choices.map((choice) => (
						<SurveyQuestionChoice key={choice.answer} choice={choice} />
					))}
				</SurveyQuestionChoices>
			)}
		</SurveyQuestionBody>
		<SurveyQuestionSubmit />
	</SurveyQuestion>
)
```

## Configuration

Create a `SurveyConfig` to customize behavior:

```typescript
import { SurveyConfig } from '@coursebuilder/survey'

const config: SurveyConfig = {
  answerSubmitUrl: process.env.NEXT_PUBLIC_CONVERTKIT_ANSWER_URL,
  afterCompletionMessages: {
    neutral: {
      default: 'Thanks!',
      last: 'Thanks! That was the final question.'
    },
    correct: {
      default: 'Correct!',
      last: 'Correct! Survey complete.'
    },
    incorrect: {
      default: 'Not quite!',
      last: 'Not quite! Survey complete.'
    }
  },
  questionBodyRenderer: (question) => {
    // Custom renderer for question bodies
    return <CustomQuestionBody question={question} />
  }
}
```

## Offer Machine Options

Control survey eligibility and flow:

```typescript
useSurveyPageOfferMachine(surveyId, subscriber, loading, {
  initialAnswers: { skill_level: 'expert' },  // Pre-populate answers
  initialState: 'presentingCurrentOffer'      // Start at specific state
})

// Machine input options
{
  canSurveyAnon: true,           // Allow anonymous users
  askAllQuestions: true,         // Show all questions in sequence
  bypassNagProtection: true,     // Skip eligibility checks
  surveyId: 'my_survey',
  answers: {}                    // Initial answers
}
```

## Types

```typescript
import type {
	Choice,
	Offer,
	QuestionResource,
	QuestionSet,
	QuizResource,
	Subscriber,
	SurveyQuestion,
	SurveyState,
} from '@coursebuilder/survey'
```

## Exports

```typescript
// State machines
export { surveyMachine, offerMachine }
export type {
	SurveyMachineContext,
	SurveyMachineEvent,
	OfferMachineEvent,
	OfferContext,
}

// React hooks
export { useSurveyPageOfferMachine, useSurveyPopupOfferMachine }

// Components
export {
	SurveyQuestion,
	SurveyQuestionHeader,
	SurveyQuestionBody,
	SurveyQuestionChoices,
	SurveyQuestionChoice,
	SurveyQuestionInput,
	SurveyQuestionAnswer,
	SurveyQuestionFooter,
	SurveyQuestionSubmit,
	SurveyQuestionEssay,
	SurveyQuestionEmail,
}

// Configuration
export { surveyConfig, surveyData, typescript2024SurveyConfig }
export type { SurveyConfig }

// Types
export type {
	QuizResource,
	QuestionResource,
	QuestionSet,
	Choice,
	SurveyState,
	SurveyQuestion,
	Subscriber,
	Offer,
}
```

## Development

```bash
# Build the package
pnpm build

# Watch mode
pnpm dev

# Type checking
pnpm typecheck

# Run tests
pnpm test
pnpm test:watch
```

## Dependencies

- **XState v5** - State machine orchestration
- **React 19** - UI components
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **date-fns** - Date manipulation for eligibility checks
