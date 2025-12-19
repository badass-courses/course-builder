import { useState } from 'react'
import { type Subscriber } from '@/schemas/subscriber'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const defaultFormSchema = z.object({
	email: z.string().email('Invalid email address').min(1, 'Required'),
	first_name: z.string().optional(),
})

type FormValues = z.infer<typeof defaultFormSchema>

/**
 * Hook for managing ConvertKit form submissions with react-hook-form and zod validation
 */
export function useConvertkitForm<
	T extends z.ZodType<any, any, any> = typeof defaultFormSchema,
>({
	submitUrl = `/api/coursebuilder/subscribe-to-list/convertkit`,
	formId = 0,
	fields,
	onSuccess,
	onError,
	validationSchema,
	mode = 'onSubmit',
}: {
	submitUrl?: string
	formId?: number
	onSuccess: (subscriber: Subscriber, email?: string) => void
	onError: (error?: any) => void
	fields?: any
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
			const response = await axios.post(submitUrl, {
				email: data.email,
				name: data.first_name,
				...(formId > 0 ? { form: formId } : {}),
				fields,
			})

			const subscriber: Subscriber = response.data

			if (!subscriber) {
				setStatus('error')
				onError()
			} else {
				setStatus('success')
				onSuccess(subscriber, data.email)
			}
		} catch (error) {
			setStatus('error')
			onError(error)
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
