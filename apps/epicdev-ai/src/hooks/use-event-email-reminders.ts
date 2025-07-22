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

type AttachEmailParams = {
	eventId: string
	emailId: string
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

const ReminderEmailFormSchema = NewEmailSchema.extend({
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
		onMutate: async ({ eventId, emailId }) => {
			await utils.events.getEventReminderEmails.cancel({ eventId })
			await utils.events.getAllReminderEmails.cancel()

			const previousEventEmails = utils.events.getEventReminderEmails.getData({
				eventId,
			})
			const previousAllEmails = utils.events.getAllReminderEmails.getData()

			if (previousAllEmails && previousEventEmails) {
				const emailToAttach = previousAllEmails.emails.find(
					(e) => e.id === emailId,
				)
				if (emailToAttach) {
					// Add the email to the existing list instead of replacing it
					utils.events.getEventReminderEmails.setData({ eventId }, [
						...previousEventEmails,
						emailToAttach,
					])
				}
			}

			return { previousEventEmails, previousAllEmails }
		},
		onError: (err, variables, context) => {
			if (context?.previousEventEmails !== undefined) {
				utils.events.getEventReminderEmails.setData(
					{ eventId: variables.eventId },
					context.previousEventEmails,
				)
			}
		},
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
		onMutate: async ({ eventId, emailId }) => {
			await utils.events.getEventReminderEmails.cancel({ eventId })
			await utils.events.getAllReminderEmails.cancel()

			const previousEventEmails = utils.events.getEventReminderEmails.getData({
				eventId,
			})

			if (previousEventEmails) {
				// Remove only the specific email being detached
				const updatedEmails = previousEventEmails.filter(
					(email) => email.id !== emailId,
				)
				utils.events.getEventReminderEmails.setData({ eventId }, updatedEmails)
			}

			return { previousEventEmails }
		},
		onError: (err, variables, context) => {
			if (context?.previousEventEmails !== undefined) {
				utils.events.getEventReminderEmails.setData(
					{ eventId: variables.eventId },
					context.previousEventEmails,
				)
			}
		},
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

	const isLoading =
		eventEmailsStatus === 'pending' ||
		allEmailsStatus === 'pending' ||
		isAttachingEmail ||
		isDetachingEmail ||
		isCreatingAndAttachingEmail ||
		isUpdatingEmailHours

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

		// Granular loading helpers
		isDetachingEmailId: (emailId: string) =>
			isDetachingEmail && detachVariables?.emailId === emailId,
		isAttachingEmailId: (emailId: string) =>
			isAttachingEmail && attachVariables?.emailId === emailId,
		isUpdatingHoursForEmail: (emailId: string) =>
			isUpdatingEmailHours && updateHoursVariables?.emailId === emailId,

		// Actions
		attachEmail: (params: AttachEmailParams) => attachEmail(params),
		detachEmail: (params: AttachEmailParams) => detachEmail(params),
		createAndAttachEmail: (params: CreateAndAttachEmailParams) =>
			createAndAttachEmail(params),
		updateEmailHours: (params: UpdateEmailHoursParams) =>
			updateEmailHours(params),
	}
}
