'use client'

import React from 'react'
import Spinner from '@/components/spinner'
import { useConvertkitForm } from '@/hooks/use-convertkit-form'
import { type Subscriber } from '@/schemas/subscriber'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
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
	onError?: (error?: any) => void
	onSuccess?: (subscriber?: Subscriber, email?: string) => void
	formId?: number
	subscribeApiURL?: string
	id?: string
	fields?: Record<string, string>
	className?: string
	validationSchema?: z.ZodType<any, any, any>
	mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all'
	[rest: string]: any
	emailPlaceholder?: string
}

/**
 * This form posts to a designated api URL (assumes `/api/convertkit/subscribe
 * by default`)
 *
 * Styling is handled by css! In the following example we utilize Tailwind and `@apply`
 *
 * @example
 * ```css
 * [data-sr-convertkit-subscribe-form] {
 *     @apply flex flex-col w-full max-w-[340px] mx-auto;
 *     [data-sr-input] {
 *         @apply block mb-4 w-full px-4 py-3 border placeholder-opacity-60 bg-opacity-50 rounded-lg shadow sm:text-base sm:leading-6;
 *     }
 *     [data-sr-input-label] {
 *         @apply font-medium pb-1 inline-block;
 *     }
 *     [data-sr-input-asterisk] {
 *         @apply opacity-50;
 *     }
 *     [data-sr-button] {
 *         @apply pt-4 pb-5 mt-4 flex items-center justify-center rounded-lg text-black bg-yellow-500 hover:bg-opacity-100 transition font-bold text-lg focus-visible:ring-yellow-200 hover:scale-105 hover:-rotate-1 hover:bg-yellow-400;
 *     }
 * }
 *```
 * @param formId the Convertkit form id, defaults to `process.env.NEXT_PUBLIC_CONVERTKIT_SIGNUP_FORM`
 * @param submitButtonElem an element to use as the button for the form submit
 * @param errorMessage A string or element representing the message shown on error
 * @param successMessage A string or element representing the message shown on success
 * @param actionLabel Label for the button (not used if submitButtonElem is used)
 * @param onError function to call on error
 * @param onSuccess function to call on success
 * @param subscribeApiURL optional param to override the api url that gets posted to
 * @param id
 * @param fields custom subscriber fields to create or update
 * @param className
 * @param validationSchema
 * @param mode validation mode ('onSubmit', 'onChange', 'onBlur', 'onTouched', 'all')
 * @param rest anything else!
 * @constructor
 */
export const SubscribeToConvertkitForm: React.FC<
	React.PropsWithChildren<SubscribeFormProps>
> = ({
	formId,
	submitButtonElem,
	errorMessage = <p>Something went wrong.</p>,
	successMessage = <p>Thanks!</p>,
	actionLabel = 'Subscribe',
	onError = () => {},
	onSuccess = () => {},
	subscribeApiURL,
	id,
	fields,
	className,
	validationSchema,
	mode,
	emailPlaceholder = 'you@example.com',
	...rest
}) => {
	const { isSubmitting, status, register, handleSubmit, errors, touched } =
		useConvertkitForm({
			formId,
			onSuccess,
			onError,
			fields,
			submitUrl: subscribeApiURL,
			validationSchema,
			mode,
		})

	return (
		<form
			data-sr-convertkit-subscribe-form={status}
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
					className="h-auto"
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
					className="h-auto"
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
					variant="default"
					size="lg"
					disabled={
						Boolean(errors.first_name) ||
						Boolean(errors.email) ||
						Boolean(isSubmitting)
					}
					type="submit"
					formNoValidate={Boolean(validationSchema)}
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

export default SubscribeToConvertkitForm

export const redirectUrlBuilder = (
	subscriber: Subscriber,
	path: string,
	queryParams?: {
		[key: string]: string
	},
) => {
	const url = queryString.stringifyUrl({
		url: path,
		query: {
			[CK_SUBSCRIBER_KEY]: subscriber.id,
			email: subscriber.email_address,
			...queryParams,
		},
	})
	return url
}
