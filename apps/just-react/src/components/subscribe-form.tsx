'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/spinner'
import { useSubscribeForm } from '@/hooks/use-subscribe-form'
import { type SubscribeResult } from '@/lib/subscribe-actions'
import queryString from 'query-string'
import { z } from 'zod'

import { Button, Input, Label } from '@coursebuilder/ui'

export type SubscribeFormProps = {
	actionLabel?: string
	successMessage?: string | React.ReactElement
	errorMessage?: string | React.ReactElement
	submitButtonElem?: React.ReactElement<{
		type?: 'submit'
		disabled?: boolean
		children?: React.ReactNode
	}>
	onError?: (error?: string) => void
	onSuccess?: (
		result: SubscribeResult & { success: true },
		email?: string,
	) => void
	id?: string
	className?: string
	validationSchema?: z.ZodType<any, any, any>
	mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all'
	emailPlaceholder?: string
	/** Path to redirect to on successful subscription. Pass null to disable redirect. */
	redirectTo?: string | null
	[rest: string]: any
}

/**
 * A database-backed email subscription form component.
 * Stores email addresses directly in the database instead of ConvertKit.
 *
 * @param submitButtonElem - Optional custom element to use as the submit button
 * @param errorMessage - A string or element representing the message shown on error
 * @param successMessage - A string or element representing the message shown on success
 * @param actionLabel - Label for the button (not used if submitButtonElem is used)
 * @param onError - Function to call on error
 * @param onSuccess - Function to call on success
 * @param id - Optional id for form fields
 * @param className - CSS class for the form
 * @param validationSchema - Optional zod schema for validation
 * @param mode - Validation mode ('onSubmit', 'onChange', 'onBlur', 'onTouched', 'all')
 * @param emailPlaceholder - Placeholder text for email input
 * @param redirectTo - Path to redirect on success (defaults to /confirmed, pass null to disable)
 */
export const SubscribeForm: React.FC<
	React.PropsWithChildren<SubscribeFormProps>
> = ({
	submitButtonElem,
	errorMessage = <p>Something went wrong.</p>,
	successMessage = <p>Thanks!</p>,
	actionLabel = 'Subscribe',
	onError = () => {},
	onSuccess = () => {},
	id,
	className,
	validationSchema,
	mode,
	emailPlaceholder = 'you@example.com',
	redirectTo = '/confirmed',
	...rest
}) => {
	const router = useRouter()

	const handleSuccess = (
		result: SubscribeResult & { success: true },
		email?: string,
	) => {
		onSuccess(result, email)

		if (redirectTo) {
			const url = queryString.stringifyUrl({
				url: redirectTo,
				query: { email: result.email },
			})
			router.push(url)
		}
	}

	const { isSubmitting, status, register, handleSubmit, errors, touched } =
		useSubscribeForm({
			onSuccess: handleSuccess,
			onError,
			validationSchema,
			mode,
		})

	return (
		<form
			data-sr-subscribe-form={status}
			onSubmit={handleSubmit}
			className={className}
			{...rest}
		>
			<div data-sr-fieldset="" className="w-full">
				<Label
					data-sr-input-label=""
					htmlFor={id ? `first_name_${id}` : 'first_name'}
				>
					First Name
				</Label>
				<Input
					data-input-with-error={Boolean(
						touched.first_name && errors.first_name,
					)}
					className="h-auto text-lg"
					id={id ? `first_name_${id}` : 'first_name'}
					placeholder="Name"
					type="text"
					{...register('first_name')}
				/>
				{validationSchema && touched.first_name && errors.first_name && (
					<p data-input-error-message>{errors.first_name?.message}</p>
				)}
			</div>
			<div data-sr-fieldset="" className="w-full">
				<Label data-sr-input-label="" htmlFor={id ? `email_${id}` : 'email'}>
					Email*
				</Label>
				<Input
					data-input-with-error={Boolean(touched.email && errors.email)}
					className="h-auto text-lg"
					id={id ? `email_${id}` : 'email'}
					placeholder={emailPlaceholder}
					type="email"
					required
					{...register('email')}
				/>
				{validationSchema && touched.email && errors.email && (
					<p data-input-error-message>{errors.email?.message}</p>
				)}
			</div>
			{submitButtonElem ? (
				React.cloneElement(submitButtonElem, {
					type: 'submit',
					disabled: Boolean(isSubmitting),
					children: isSubmitting ? (
						<Spinner className="h-5 w-5" />
					) : (
						submitButtonElem.props.children
					),
				})
			) : (
				<Button
					data-sr-button="default"
					variant="default"
					size="lg"
					disabled={
						Boolean(errors.first_name) ||
						Boolean(errors.email) ||
						Boolean(isSubmitting)
					}
					type="submit"
					formNoValidate={Boolean(validationSchema)}
					className="h-11 text-lg"
				>
					{isSubmitting ? <Spinner className="h-5 w-5" /> : actionLabel}
				</Button>
			)}
			{status === 'success' &&
				(React.isValidElement(successMessage) ? (
					successMessage
				) : (
					<p>{successMessage}</p>
				))}
			{status === 'error' &&
				(React.isValidElement(errorMessage) ? (
					errorMessage
				) : (
					<p>{errorMessage}</p>
				))}
		</form>
	)
}

export default SubscribeForm
