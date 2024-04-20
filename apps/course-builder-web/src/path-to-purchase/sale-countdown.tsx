import React from 'react'
import pluralize from 'pluralize'
import Countdown, { type CountdownRenderProps } from 'react-countdown'

const SaleCountdown: React.FC<
	React.PropsWithChildren<{ coupon: any; size?: 'sm' | 'lg' }>
> = ({ coupon, size = 'lg', ...rest }) => {
	// storing coupon in state so that it doesn't rerender
	// and cause layout shift when quantity changes
	const [storedCoupon, setStoredCoupon] = React.useState(coupon)
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => {
		setMounted(true)
	}, [])
	React.useEffect(() => {
		coupon && setStoredCoupon(coupon)
	}, [coupon])

	if (!storedCoupon?.expires) return null

	return mounted ? (
		<Countdown
			date={storedCoupon.expires}
			renderer={(props) =>
				size === 'sm' ? (
					<CountdownRendererSm {...props} {...rest} />
				) : (
					<CountdownRendererLg {...props} {...rest} />
				)
			}
		/>
	) : null
}

export default SaleCountdown

const CountdownRendererLg: React.FC<
	React.PropsWithChildren<CountdownRenderProps>
> = ({ days, hours, minutes, seconds, completed, ...rest }) => {
	const [srValues] = React.useState({
		days,
		hours,
		minutes,
		seconds,
	})
	const screenReaderValues = `${srValues.days} days, ${srValues.hours} hours, ${srValues.minutes} minutes, and ${srValues.seconds} seconds`

	return completed ? null : (
		<>
			<div className="w-full px-10 pb-7" {...rest}>
				<div className="w-full rounded-lg text-center">
					<p className="pb-5 font-medium">Hurry! Price goes up in:</p>
					<div
						aria-hidden="true"
						data-grid=""
						className="mx-auto grid max-w-[300px] grid-cols-4 items-center justify-center gap-2 tabular-nums tracking-tight"
					>
						<div className="flex flex-col">
							<span
								data-number="days"
								className="text-3xl font-medium leading-none"
							>
								{days}
							</span>
							<span
								data-label="days"
								className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-500"
							>
								days
							</span>
						</div>
						<div className="flex flex-col">
							<span
								data-number="hours"
								className="text-3xl font-medium leading-none"
							>
								{hours}
							</span>
							<span
								data-label="hours"
								className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-500"
							>
								hours
							</span>
						</div>
						<div className="flex flex-col">
							<span
								data-number="minutes"
								className="text-3xl font-medium leading-none"
							>
								{minutes}
							</span>
							<span
								data-label="minutes"
								className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-500"
							>
								minutes
							</span>
						</div>
						<div className="flex flex-col">
							<span
								data-number="seconds"
								className="text-3xl font-medium leading-none"
							>
								{seconds}
							</span>
							<span
								data-label="seconds"
								className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-500"
							>
								seconds
							</span>
						</div>
					</div>
					<div className="sr-only">{screenReaderValues}</div>
				</div>
			</div>
		</>
	)
}

const CountdownRendererSm: React.FC<
	React.PropsWithChildren<CountdownRenderProps>
> = ({ days, hours, minutes, seconds, completed, ...rest }) => {
	const [srValues] = React.useState({
		days,
		hours,
		minutes,
		seconds,
	})

	return completed ? null : (
		<>
			<div className="w-full px-10 pb-7" {...rest}>
				<div className="w-full rounded-lg text-center">
					<p className="flex items-center gap-1">
						<ClockIcon className="w-5" />{' '}
						{days > 0
							? `${days} ${pluralize('day', days)}`
							: hours > 0
								? `${hours} ${pluralize('hour', hours)}`
								: minutes > 0
									? `${minutes} ${pluralize('minute', minutes)}`
									: `${seconds} ${pluralize('second', seconds)}`}{' '}
						left at this price!
					</p>
				</div>
			</div>
		</>
	)
}
