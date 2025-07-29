import React, { useEffect, useRef, useState } from 'react'
import Spinner from '@/components/spinner'
import { useConvertkitForm } from '@/hooks/use-convertkit-form'
import { type Subscriber } from '@/schemas/subscriber'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { LockIcon, ShieldCheckIcon } from 'lucide-react'
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
		<div
			data-waitlist-form
			className="relative mb-6 mt-6 scroll-mt-[calc(var(--header-height)*2)]"
			id={id}
		>
			{/* Remove the old bear container that was causing the duplicate */}
			<div
				className="[[inert]_svg]:animate-none relative"
				data-waitlist-content=""
			>
				<p className="mb-4 text-pretty">
					You want to build exceptional user interfaces, I want to empower you
					to do so.
					<br />
					<strong className="text-balance font-bold text-[canvasText]">
						Join the waitlist to learn more and get course launch updates.
					</strong>
				</p>
				{/* Hide form on success */}
				{status !== 'success' && (
					<form
						data-sr-convertkit-subscribe-form={status}
						onSubmit={handleSubmit}
						className={className}
						{...rest}
					>
						<div
							data-controls
							className="mb-4 flex w-full flex-wrap items-center justify-end gap-2"
						>
							<label
								className="sr-only"
								data-sr-input-label=""
								htmlFor={id ? `first_name_${id}` : 'first_name'}
							>
								Preferred name
							</label>
							<input
								autoComplete="off"
								className={cn(
									'h-9 flex-1 rounded-md border border-gray-300 px-4 outline-none',
									'placeholder:text-sm focus-visible:border-red-400',
									'text-[canvasText] placeholder:text-gray-400',
								)}
								id={id ? `first_name_${id}` : 'first_name'}
								onChange={handleChange}
								defaultValue={values.first_name}
								name="first_name"
								type="text"
								placeholder="Your name [optional]"
							/>
							<label
								className="sr-only"
								data-sr-input-label=""
								htmlFor={id ? `email_${id}` : 'email'}
							>
								Email Address
							</label>
							<div
								className={cn(
									'relative flex flex-1 focus-within:has-[:invalid:not(:placeholder-shown)]:[&_div]:[--show:1]',
									'isolate',
								)}
							>
								{/* Mascot bear - shows when email input is focused */}
								{showMascot && (
									<svg
										className="absolute -top-8 left-[70%] -z-50 w-12 delay-200 ease-out motion-safe:transition-transform"
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
										/>
										<circle
											cx="36.8416"
											cy="36.8416"
											r="34.8416"
											fill="#AF7128"
											stroke="#000"
											strokeWidth="4"
										/>
										<circle
											cx="202.952"
											cy="36.8416"
											r="34.8416"
											fill="#AF7128"
											stroke="#000"
											strokeWidth="4"
										/>
										<circle
											className="origin-center animate-[blink_8s_infinite] [transform-box:fill-box]"
											cx="174.19"
											cy="105.677"
											r="8.0793"
											fill="#000"
										/>
										<circle
											className="origin-center animate-[blink_8s_infinite] [transform-box:fill-box]"
											cx="65.604"
											cy="105.677"
											r="8.0793"
											fill="#000"
										/>
										<path
											d="M140.689 120.281c0 8.21-9.868 17.451-20.844 17.451-10.977 0-20.845-9.241-20.845-17.451C99 112.07 108.868 108 119.845 108c10.976 0 20.844 4.07 20.844 12.281Z"
											fill="#000"
										/>
										<path
											fill="#FF1E1E"
											d="M75.2366 69.8052h88.3706v13.25H75.2366z"
										/>
										<path
											fillRule="evenodd"
											clipRule="evenodd"
											d="M187.215 28.6207c17.939 14.394 28.018 37.1482 28.018 57.5045h-61.648c-.087-13.6688-11.194-24.7227-24.883-24.7227h-18.56c-13.6891 0-24.7966 11.0539-24.8835 24.7227H23.9148c0-20.3563 10.0783-43.1105 28.0178-57.5045C69.8722 14.2266 94.2034 6.1401 119.574 6.1401c25.37 0 49.701 8.0865 67.641 22.4806Z"
											fill="#000"
										/>
									</svg>
								)}
								<input
									autoComplete="off"
									className={cn(
										'relative z-10 h-9 flex-1 rounded-md border border-gray-300 px-4 outline-none',
										'placeholder:text-sm focus-visible:border-red-400',
										'text-[canvasText] placeholder:text-gray-400',
										'bg-background',
									)}
									name="email"
									type="email"
									placeholder="Email"
									required
									id={id ? `email_${id}` : 'email'}
									onChange={handleChange}
									defaultValue={values.email}
									onFocus={onEmailFocus}
									onBlur={onEmailBlur}
								/>
							</div>
							<button
								aria-label={isSubmitting ? 'Submitting...' : 'Join'}
								aria-disabled={isSubmitting}
								className={cn(
									"[[aria-label='Done']]:bg-green-600 group overflow-hidden",
									'relative rounded-md bg-red-600 text-white',
									'shadow-inner shadow-gray-100/50 motion-safe:transition-all',
									'grid h-9 cursor-pointer place-items-center active:scale-[0.98]',
									"after:absolute after:inset-0 after:rounded-md after:content-['']",
									'after:bg-gradient-to-b after:from-white/40 after:to-white/10',
									'after:opacity-70 hover:after:opacity-100 after:motion-safe:transition-all',
								)}
								type="submit"
							>
								<span
									className={cn(
										'motion-safe:transition-all',
										"group-[[aria-label='Submitting...']]:translate-x-full",
										"group-[[aria-label='Done']]:translate-x-[200%]",
										'relative h-full w-full',
									)}
								>
									<span
										className={cn(
											'text-shadow-lg grid h-full place-items-center px-4 py-1 [text-shadow:0_1px_1px_var(--color-red-800)]',
											"h-full group-[[aria-label='Submitting...']]:opacity-0",
										)}
									>
										Join
									</span>
									<span
										className={cn(
											'absolute inset-0 grid h-full w-full -translate-x-full place-items-center',
											'opacity-0 motion-safe:transition-opacity',
											"group-[[aria-label='Submitting...']]:opacity-100",
										)}
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
											stroke="currentColor"
											aria-hidden="true"
											className={cn(
												'animate-spin overflow-visible [animation-play-state:paused] [animation-timing-function:steps(8)]',
												"aspect-square w-6 motion-safe:group-[[aria-label='Submitting...']]:[animation-play-state:running]",
											)}
										>
											<path
												d="M12 18V22"
												strokeWidth="2"
												strokeOpacity="1"
												strokeLinecap="round"
											></path>
											<path
												d="M19.0703 19.0703L16.2419 16.2419"
												strokeWidth="2"
												strokeLinecap="round"
												strokeOpacity="0.875"
											></path>
											<path
												d="M6 12L2 12"
												strokeWidth="2"
												strokeLinecap="round"
												strokeOpacity="0.25"
											></path>
											<path
												d="M12 2V6"
												strokeWidth="2"
												strokeLinecap="round"
												strokeOpacity="0.5"
											></path>
											<path
												d="M22 12L18 12"
												strokeWidth="2"
												strokeLinecap="round"
												strokeOpacity="0.75"
											></path>
											<path
												d="M7.75781 7.75781L4.92939 4.92939"
												strokeWidth="2"
												strokeLinecap="round"
												strokeOpacity="0.375"
											></path>
											<path
												d="M16.2422 7.75781L19.0706 4.92939"
												strokeWidth="2"
												strokeLinecap="round"
												strokeOpacity="0.625"
											></path>
											<path
												d="M4.92969 19.0703L7.75811 16.2419"
												strokeWidth="2"
												strokeLinecap="round"
												strokeOpacity="0.125"
											></path>
										</svg>
									</span>
									<span
										className={cn(
											'absolute inset-0 grid h-full w-full -translate-x-[200%] place-items-center',
											'opacity-0 motion-safe:transition-opacity',
											"group-[[aria-label='Done']]:opacity-100",
										)}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											aria-hidden="true"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M20 6 9 17l-5-5"></path>
										</svg>
									</span>
								</span>
							</button>
						</div>
					</form>
				)}
				{/* Success message */}
				{status === 'success' && (
					<div className="mt-8 flex flex-col items-center justify-center">
						<p className="rounded-md border border-green-800 bg-green-200/10 p-2 text-green-800 dark:border-green-200 dark:text-green-200">
							<strong className="font-[500]">
								Thanks{values.first_name ? ` ${values.first_name}` : ''}!
							</strong>
							<br />
							Please check your email to confirm your subscription.
						</p>
					</div>
				)}
				{!formId && status !== 'success' && (
					<p
						data-nospam=""
						className="text-muted-foreground mx-auto inline-flex w-full items-center justify-center text-center text-xs opacity-75 sm:text-sm"
					>
						<ShieldCheckIcon className="mr-2 h-4 w-4" /> I respect your privacy.
						Unsubscribe at any time.
					</p>
				)}
			</div>
			{isSubmitting ? <p className="sr-only">loading...</p> : null}
		</div>
	)
}

export default SubscribeToConvertkitForm
