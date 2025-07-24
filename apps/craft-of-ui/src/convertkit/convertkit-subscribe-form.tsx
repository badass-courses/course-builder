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

	console.info({ status, values })

	const [showBear, setShowBear] = useState(false)

	useEffect(() => {
		if (status === 'success') {
			setShowBear(true)
		}
	}, [status])

	return (
		<div
			data-waitlist-form
			className="relative mb-6 mt-6 scroll-mt-[calc(var(--header-height)*2)]"
			id={id}
		>
			{/* Bear with balloon animation on success */}
			{status === 'success' && showBear && (
				<div
					data-bear-cave
					className="pointer-events-none fixed inset-0 z-[100] mx-auto w-[600px] max-w-[calc(100vw-2rem)] overflow-visible"
				>
					<div
						aria-hidden="true"
						className={cn(
							'absolute left-1/2 w-20 -translate-x-1/2 drop-shadow-lg',
							status === 'success'
								? 'animate-bear-float-up'
								: 'translate-y-full',
						)}
						data-bear-template
						style={{ bottom: 0 }}
					>
						<svg
							className="overflow-visible"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 478 931"
						>
							<rect
								width="115"
								height="52"
								x="294.5"
								y="872.5"
								fill="#AF7128"
								stroke="#000"
								strokeWidth="6"
								rx="26"
								transform="rotate(-90 294.5 872.5)"
							></rect>
							<path
								d="M294.5 783.5V846.5C294.5 860.859 306.141 872.5 320.5 872.5C334.859 872.5 346.5 860.859 346.5 846.5V783.5C346.5 769.141 334.859 757.5 320.5 757.5C306.141 757.5 294.5 769.141 294.5 783.5Z"
								fill="#AF7128"
								stroke="black"
							/>
							<path
								d="M318.674 859.205C318.674 857.548 317.331 856.205 315.674 856.205C314.017 856.205 312.674 857.548 312.674 859.205H318.674ZM318.674 871.205V859.205H312.674V871.205H318.674ZM331.34 859.205C331.34 857.548 329.996 856.205 328.34 856.205C326.683 856.205 325.34 857.548 325.34 859.205H331.34ZM331.34 871.205V859.205H325.34V871.205H331.34Z"
								fill="black"
							/>
							<path
								d="M272.653 584.433C264.081 570.25 265.905 551.554 278.132 539.327C292.52 524.94 315.863 524.957 330.272 539.365C340.425 549.518 343.432 564.107 339.289 576.874C352.36 580.791 364.679 587.914 375.007 598.243L389.17 612.405C399.452 622.688 406.558 634.942 410.486 647.947C423.23 643.849 437.773 646.866 447.901 656.995C462.31 671.403 462.327 694.747 447.939 709.135C435.761 721.313 417.166 723.171 403.005 714.716C399.332 721.152 394.75 727.21 389.258 732.701L342.193 779.767L264.61 857.35C262.633 859.327 260.887 861.521 259.404 863.891L243.643 889.088C240.437 894.213 236.893 899.552 231.259 901.743C223.369 904.811 214.061 903.155 207.684 896.778L194.569 884.931L187.165 878.072L178.16 868.832C169.556 860.228 172.326 848.624 177.145 838.223L190.459 815.162C188.411 813.755 185.748 810.468 183.939 808.659C182.376 807.096 180.889 803.872 179.627 802.128L164.298 823.3C157.786 831.718 144.057 833.152 135.453 824.547L109.25 799.024C100.646 790.42 93.7864 777.972 104.273 762.254L150.623 702.243C149.789 699.54 149.339 696.668 149.337 693.692L149.291 630.646C149.279 614.618 162.263 601.634 178.291 601.646C194.319 601.658 207.321 614.66 207.333 630.688L207.344 645.522L254.711 598.155C260.191 592.675 266.233 588.101 272.653 584.433Z"
								fill="#AF7128"
							/>
							<path
								d="M342.193 779.767L389.258 732.701C394.75 727.21 399.332 721.152 403.005 714.716C417.166 723.171 435.761 721.313 447.939 709.135C462.327 694.747 462.31 671.403 447.901 656.995C437.773 646.866 423.23 643.849 410.486 647.947C406.558 634.942 399.452 622.688 389.17 612.405L375.007 598.243C364.679 587.914 352.36 580.791 339.289 576.874C343.432 564.107 340.425 549.518 330.272 539.365C315.863 524.957 292.52 524.94 278.132 539.327C265.905 551.554 264.081 570.25 272.653 584.433C266.233 588.101 260.191 592.675 254.711 598.155L207.344 645.522L207.333 630.688C207.321 614.66 194.319 601.658 178.291 601.646C162.263 601.634 149.279 614.618 149.291 630.646L149.337 693.692C149.339 696.668 149.789 699.54 150.623 702.243L104.273 762.254C93.7864 777.972 100.646 790.42 109.25 799.024L135.453 824.547C144.057 833.152 157.786 831.718 164.298 823.3L179.627 802.128C180.889 803.872 182.376 807.096 183.939 808.659C185.748 810.468 188.411 813.755 190.459 815.162L177.145 838.223C172.326 848.624 169.556 860.228 178.16 868.832L187.165 878.072L194.569 884.931L207.684 896.778C214.061 903.155 223.369 904.811 231.259 901.743C236.893 899.552 240.437 894.213 243.643 889.088L259.404 863.891C260.887 861.521 262.633 859.327 264.61 857.35L304.425 817.535"
								stroke="black"
							/>
							<path
								d="M178.783 616.187C178.784 617.844 180.128 619.188 181.785 619.189C183.442 619.191 184.784 617.848 184.783 616.192L178.783 616.187ZM178.774 604.178L178.783 616.187L184.783 616.192L184.774 604.183L178.774 604.178ZM166.676 616.178C166.677 617.835 168.021 619.179 169.678 619.181C171.335 619.182 172.677 617.84 172.676 616.183L166.676 616.178ZM166.667 604.17L166.676 616.178L172.676 616.183L172.667 604.174L166.667 604.17Z"
								fill="black"
							/>
							<path
								d="M308.738 613.92L371.317 676.499L361.948 685.868L299.369 623.289L308.738 613.92Z"
								fill="#F0C3C9"
							/>
							<path
								d="M417.156 664.094C419.682 686.976 410.729 710.203 396.335 724.597L352.68 680.942C362.284 671.215 362.246 655.545 352.566 645.865L339.372 632.671C329.692 622.991 314.022 622.953 304.295 632.557L260.855 589.117C275.249 574.723 298.476 565.77 321.358 568.296C344.239 570.821 367.187 582.333 385.153 600.299C403.119 618.265 414.631 641.213 417.156 664.094Z"
								fill="black"
							/>
							<path
								d="M343.383 719.973C346.543 723.133 351.662 723.136 354.817 719.981C357.972 716.826 357.969 711.707 354.809 708.547C351.649 705.387 346.53 705.383 343.375 708.539C340.22 711.694 340.223 716.813 343.383 719.973Z"
								fill="black"
							/>
							<path
								d="M266.489 643.079C269.649 646.239 274.768 646.242 277.923 643.087C281.078 639.932 281.075 634.813 277.915 631.653C274.755 628.493 269.636 628.489 266.481 631.645C263.325 634.8 263.329 639.919 266.489 643.079Z"
								fill="black"
							/>
							<path
								d="M315.046 700.863C309.241 706.669 295.719 706.215 287.946 698.442C280.173 690.669 279.719 677.147 285.525 671.341C291.33 665.536 301.196 669.646 308.969 677.419C316.742 685.192 320.852 695.058 315.046 700.863Z"
								fill="black"
							/>
							<path
								d="M197.373 866.873L188.888 875.358M214.369 883.869L205.883 892.354M124.435 793.935L115.95 802.42M141.43 810.93L132.945 819.415"
								stroke="black"
							/>
							<path d="M193.5 732.5L188.5 356.5" stroke="black" />
							<path
								d="M188.5 353.5C281.836 353.5 357.5 277.836 357.5 184.5C357.5 91.1639 281.836 15.5 188.5 15.5C95.1639 15.5 19.5 91.1639 19.5 184.5C19.5 277.836 95.1639 353.5 188.5 353.5Z"
								fill="#F0C3C9"
								stroke="black"
							/>
							<path
								d="M151.119 53.7383C124.612 61.3158 101.033 76.7706 83.5092 98.054C65.9853 119.337 55.3436 145.443 52.9946 172.912"
								fill="#F0C3C9"
							/>
							<path
								d="M151.119 53.7383C124.612 61.3158 101.033 76.7706 83.5092 98.054C65.9853 119.337 55.3436 145.443 52.9946 172.912"
								stroke="white"
							/>
							<path
								d="M172.5 355.5H204L213.5 375.5H163.5L172.5 355.5Z"
								fill="#F0C3C9"
								stroke="black"
							/>
							<path d="M147 668L209 626" stroke="black" />
						</svg>
					</div>
				</div>
			)}
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
								)}
							>
								{showMascot && (
									<svg
										style={{ left: '70%' }}
										className="absolute -top-8 -z-10 w-12 delay-200 ease-out motion-safe:transition-transform"
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
										'h-9 flex-1 rounded-md border border-gray-300 px-4 outline-none',
										'placeholder:text-sm focus-visible:border-red-400',
										'text-[canvasText] placeholder:text-gray-400',
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
									'relative rounded-md bg-red-600 bg-gradient-to-b from-white/10 text-gray-100',
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
