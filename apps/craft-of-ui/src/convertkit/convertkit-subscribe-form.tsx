import React from 'react'
import Spinner from '@/components/spinner'
import { useConvertkitForm } from '@/hooks/use-convertkit-form'
import { type Subscriber } from '@/schemas/subscriber'
import { api } from '@/trpc/react'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import queryString from 'query-string'
import * as Yup from 'yup'

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
	validationSchema?: Yup.ObjectSchema<any>
	validateOnChange?: boolean
	onEmailFocus?: () => void
	onEmailBlur?: () => void
	showMascot?: boolean
	[rest: string]: any
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
 * @param validateOnChange
 * @param onEmailFocus
 * @param onEmailBlur
 * @param showMascot
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
	validateOnChange,
	onEmailFocus,
	onEmailBlur,
	showMascot,
	...rest
}) => {
	const {
		isSubmitting,
		status,
		handleChange,
		handleSubmit,
		errors,
		touched,
		values,
	} = useConvertkitForm({
		formId,
		onSuccess,
		onError,
		fields,
		submitUrl: subscribeApiURL,
		validationSchema,
		validateOnChange,
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
					name="first_name"
					id={id ? `first_name_${id}` : 'first_name'}
					onChange={handleChange}
					placeholder="Preferred name"
					type="text"
					defaultValue={values.first_name}
				/>
				{validationSchema && touched.first_name && errors.first_name && (
					<p data-input-error-message>{errors.first_name}</p>
				)}
			</div>
			<div data-sr-fieldset="" className="w-full">
				<Label data-sr-input-label="" htmlFor={id ? `email_${id}` : 'email'}>
					Email*
				</Label>
				<div className="relative">
					{showMascot && (
						<svg
							className="pointer-events-none absolute -top-12 left-1/2 z-0 w-12 -translate-x-1/2"
							viewBox="0 0 240 333"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
						>
							<path
								d="M213.17 108.419c0 5.314.127 11.574.269 18.56.618 30.513 1.518 74.863-6.657 114.572-5.019 24.378-13.419 46.767-27.227 63.031C165.817 320.764 146.633 331 119.678 331c-26.9555 0-46.1392-10.236-59.8774-26.418-13.8078-16.264-22.2078-38.653-27.2266-63.031-8.175-39.709-7.2757-84.059-6.6569-114.572.1417-6.986.2686-13.246.2686-18.56 0-55.6867 41.9903-100.5811 93.4923-100.5811S213.17 52.7323 213.17 108.419Z"
								fill="#AF7128"
								stroke="#000"
								strokeWidth="4"
							></path>
							<circle
								cx="36.8416"
								cy="36.8416"
								r="34.8416"
								fill="#AF7128"
								stroke="#000"
								strokeWidth="4"
							></circle>
							<circle
								cx="202.952"
								cy="36.8416"
								r="34.8416"
								fill="#AF7128"
								stroke="#000"
								strokeWidth="4"
							></circle>
							<circle
								className="transform-fill origin-center animate-[blink_8s_infinite]"
								cx="174.19"
								cy="105.677"
								r="8.0793"
								fill="#000"
							></circle>
							<circle
								className="transform-fill origin-center animate-[blink_8s_infinite]"
								cx="65.604"
								cy="105.677"
								r="8.0793"
								fill="#000"
							></circle>
							<path
								d="M140.689 120.281c0 8.21-9.868 17.451-20.844 17.451-10.977 0-20.845-9.241-20.845-17.451C99 112.07 108.868 108 119.845 108c10.976 0 20.844 4.07 20.844 12.281Z"
								fill="#000"
							></path>
							<path
								fill="#FF1E1E"
								d="M75.2366 69.8052h88.3706v13.25H75.2366z"
							></path>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M187.215 28.6207c17.939 14.394 28.018 37.1482 28.018 57.5045h-61.648c-.087-13.6688-11.194-24.7227-24.883-24.7227h-18.56c-13.6891 0-24.7966 11.0539-24.8835 24.7227H23.9148c0-20.3563 10.0783-43.1105 28.0178-57.5045C69.8722 14.2266 94.2034 6.1401 119.574 6.1401c25.37 0 49.701 8.0865 67.641 22.4806Z"
								fill="#000"
							></path>
						</svg>
					)}
					<Input
						data-input-with-error={Boolean(touched.email && errors.email)}
						className="relative z-10 h-auto"
						name="email"
						id={id ? `email_${id}` : 'email'}
						onChange={handleChange}
						placeholder="you@example.com"
						type="email"
						required
						defaultValue={values.email}
						onFocus={onEmailFocus}
						onBlur={onEmailBlur}
					/>
				</div>
				{validationSchema && touched.email && errors.email && (
					<p data-input-error-message>{errors.email}</p>
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
						(touched.first_name && errors.first_name) ||
						(touched.email && errors.email) ||
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
