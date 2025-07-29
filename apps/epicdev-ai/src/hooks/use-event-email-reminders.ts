import { NewEmailSchema, type NewEmail } from '@/lib/emails'
import { api } from '@/trpc/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const DEFAULT_EMAIL = {
	title: 'Reminder Email',
	subject: `Tomorrow's {{title}} - Please Review Instructions First! 🚀`,
	body: `Hey {{user.name | default: "everyone"}}!

I'm really looking forward to tomorrow! Please please please, make sure to reserve an hour to go through all of the instructions on
{{url}} before tomorrow starts. It's critical to your success and learning. Otherwise you will spend the first 20 minutes or more missing instruction trying to figure out how things work and in general have a bad time.

But we don't want to have a bad time! We're going to have a good time! So check out and follow the instructions and we'll have an epic time tomorrow. And because this is an advanced workshop, please make sure you check out the resources on the README of the repo as well. See you soon!`,
}

export const MARKDOWN_EDITOR_EXTENSIONS = [
	'{{user.name | default: "everyone"}}',
	'{{url}}',
	'{{title}}',
	'{{event.fields.title}}',
	'{{event.fields.slug}}',
	'{{event.fields.details}}',
	'{{event.fields.attendeeInstructions}}',
	'{{event.fields.description}}',
]

type AttachEmailParams = {
	eventId: string
	emailId: string
	hoursInAdvance?: number
}

type CreateAndAttachEmailParams = {
	eventId: string
	input: NewEmail
	hoursInAdvance: number
}

type UpdateEmailHoursParams = {
	eventId: string
	emailId: string
	hoursInAdvance: number
}

export const ReminderEmailFormSchema = NewEmailSchema.extend({
	emailId: z.string().optional(),
	eventId: z.string().optional(),
	hoursInAdvance: z.number().min(1).max(168).default(24), // 1 hour to 1 week
})

export type ReminderEmailForm = z.infer<typeof ReminderEmailFormSchema>

/**
 * Custom hook for managing event email reminders
 * @param eventId - The ID of the event to manage reminders for
 */
export function useEventEmailReminders(eventId: string) {
	// form

	const form = useForm<ReminderEmailForm>({
		resolver: zodResolver(ReminderEmailFormSchema),
		defaultValues: {
			fields: {
				...DEFAULT_EMAIL,
			},
			hoursInAdvance: 24,
		},
	})

	const onSubmit = (data: ReminderEmailForm) => {
		const { hoursInAdvance, ...emailData } = data
		createAndAttachEmail({
			eventId: eventId,
			input: emailData,
			hoursInAdvance,
		})
	}

	const utils = api.useUtils()

	// Queries
	const { data: eventEmails, status: eventEmailsStatus } =
		api.events.getEventReminderEmails.useQuery({ eventId })

	const { data: allEmails, status: allEmailsStatus } =
		api.events.getAllReminderEmails.useQuery()

	// Mutations
	const {
		mutate: attachEmail,
		isPending: isAttachingEmail,
		variables: attachVariables,
	} = api.events.attachReminderEmailToEvent.useMutation({
		onSettled: () => {
			utils.events.getEventReminderEmails.invalidate({ eventId })
			utils.events.getAllReminderEmails.invalidate()
		},
	})

	const {
		mutate: detachEmail,
		isPending: isDetachingEmail,
		variables: detachVariables,
	} = api.events.detachReminderEmailFromEvent.useMutation({
		onSettled: () => {
			utils.events.getEventReminderEmails.invalidate({ eventId })
			utils.events.getAllReminderEmails.invalidate()
		},
	})

	const {
		mutate: createAndAttachEmail,
		isPending: isCreatingAndAttachingEmail,
	} = api.events.createAndAttachReminderEmailToEvent.useMutation({
		onSettled: () => {
			utils.events.getAllReminderEmails.invalidate()
			utils.events.getEventReminderEmails.invalidate({ eventId })
		},
		onSuccess: () => {
			form.reset()
		},
	})

	const {
		mutate: updateEmailHours,
		isPending: isUpdatingEmailHours,
		variables: updateHoursVariables,
	} = api.events.updateReminderEmailHours.useMutation({
		onSuccess: () => {
			utils.events.getEventReminderEmails.invalidate({ eventId })
			utils.events.getAllReminderEmails.invalidate()
		},
	})

	const {
		mutate: updateEmail,
		isPending: isUpdatingEmail,
		variables: updateVariables,
	} = api.events.updateReminderEmail.useMutation({
		onSuccess: () => {
			utils.events.getEventReminderEmails.invalidate({ eventId })
			utils.events.getAllReminderEmails.invalidate()
		},
	})

	const isLoading =
		eventEmailsStatus === 'pending' ||
		allEmailsStatus === 'pending' ||
		isAttachingEmail ||
		isDetachingEmail ||
		isCreatingAndAttachingEmail ||
		isUpdatingEmailHours ||
		isUpdatingEmail

	return {
		// Form
		form,
		onSubmit,

		// Data
		eventEmails,
		allEmails,

		// Loading states
		isLoading,
		isAttachingEmail,
		isDetachingEmail,
		isCreatingAndAttachingEmail,
		isUpdatingEmailHours,
		isUpdatingEmail,

		// Granular loading helpers
		isDetachingEmailId: (emailId: string) =>
			isDetachingEmail && detachVariables?.emailId === emailId,
		isAttachingEmailId: (emailId: string) =>
			isAttachingEmail && attachVariables?.emailId === emailId,
		isUpdatingHoursForEmail: (emailId: string) =>
			isUpdatingEmailHours && updateHoursVariables?.emailId === emailId,
		isUpdatingEmailId: (emailId: string) =>
			isUpdatingEmail && updateVariables?.emailId === emailId,

		// Actions
		attachEmail: (params: AttachEmailParams) => attachEmail(params),
		detachEmail: (params: AttachEmailParams) => detachEmail(params),
		createAndAttachEmail: (params: CreateAndAttachEmailParams) =>
			createAndAttachEmail(params),
		updateEmail: (params: ReminderEmailForm) => {
			if (params.emailId && params.eventId) {
				updateEmail({
					...params,
					emailId: params.emailId,
					eventId: params.eventId,
				})
			} else {
				console.log('no emailId or eventId', params)
			}
		},
		updateEmailHours: (params: UpdateEmailHoursParams) =>
			updateEmailHours(params),
	}
}
