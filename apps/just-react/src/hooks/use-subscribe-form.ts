import { useState } from 'react'
import {
	subscribeToNewsletter,
	type SubscribeResult,
} from '@/lib/subscribe-actions'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const defaultFormSchema = z.object({
	email: z.string().email('Invalid email address').min(1, 'Required'),
	first_name: z.string().optional(),
})

type FormValues = z.infer<typeof defaultFormSchema>

/**
 * Hook for managing database-backed email subscription forms with react-hook-form and zod validation.
 * This is a database-backed alternative to useConvertkitForm.
 *
 * @param options - Configuration options for the subscribe form
 * @param options.onSuccess - Callback invoked on successful subscription
 * @param options.onError - Callback invoked on subscription failure
 * @param options.validationSchema - Optional custom zod schema (defaults to email + optional first_name)
 * @param options.mode - react-hook-form validation mode (default: 'onSubmit')
 * @returns Form state, handleSubmit, status, isSubmitting, errors, and touched fields
 *
 * @example
 * ```ts
 * const { handleSubmit, register, status } = useSubscribeForm({
 *   onSuccess: (result) => console.log('Subscribed!', result),
 *   onError: (error) => console.error(error),
 * })
 * ```
 */
export function useSubscribeForm<
	T extends z.ZodType<any, any, any> = typeof defaultFormSchema,
>({
	onSuccess,
	onError,
	validationSchema,
	mode = 'onSubmit',
}: {
	onSuccess: (
		result: SubscribeResult & { success: true },
		email?: string,
	) => void
	onError: (error?: string) => void
	validationSchema?: T
	mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all'
}) {
	const [status, setStatus] = useState<string>('')

	const schema = (validationSchema || defaultFormSchema) as z.ZodType<
		FormValues,
		any,
		any
	>

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: '',
			first_name: '',
		},
		mode,
	})

	const handleSubmit = form.handleSubmit(async (data) => {
		try {
			const result = await subscribeToNewsletter({
				email: data.email,
				firstName: data.first_name,
			})

			if (!result.success) {
				setStatus('error')
				onError(result.error)
			} else {
				setStatus('success')
				onSuccess(result, data.email)
			}
		} catch (error) {
			setStatus('error')
			onError(error instanceof Error ? error.message : 'An error occurred')
			console.error(error)
		}
	})

	return {
		...form,
		handleSubmit,
		status,
		isSubmitting: form.formState.isSubmitting,
		errors: form.formState.errors,
		touched: form.formState.touchedFields,
	}
}
