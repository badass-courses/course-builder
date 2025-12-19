import Countdown from 'react-countdown'

export const FeaturedCountdown = ({ expires }: { expires: Date | null }) => {
	if (!expires) return null
	return (
		<Countdown
			date={expires}
			renderer={({ days, hours, minutes, seconds, completed }) => {
				if (completed) {
					return 'Offer has ended'
				}
				return (
					<>
						{days > 1 ? (
							<>
								{days} {days === 1 ? 'day' : 'days'}
							</>
						) : hours > 1 ? (
							<>
								{days > 0 && (
									<>
										{days} {days === 1 ? 'day' : 'days'},{' '}
									</>
								)}
								{hours} {hours === 1 ? 'hour' : 'hours'}
							</>
						) : minutes > 1 ? (
							<>
								{days > 0 && (
									<>
										{days} {days === 1 ? 'day' : 'days'},{' '}
									</>
								)}
								{hours > 0 && (
									<>
										{hours} {hours === 1 ? 'hour' : 'hours'},{' '}
									</>
								)}
								{minutes} {minutes === 1 ? 'minute' : 'minutes'}
							</>
						) : (
							<>
								{days > 0 && (
									<>
										{days} {days === 1 ? 'day' : 'days'},{' '}
									</>
								)}
								{hours > 0 && (
									<>
										{hours} {hours === 1 ? 'hour' : 'hours'},{' '}
									</>
								)}
								{minutes > 0 && (
									<>
										{minutes} {minutes === 1 ? 'minute' : 'minutes'}, and{' '}
									</>
								)}
								{seconds} {seconds === 1 ? 'second' : 'seconds'}
							</>
						)}
					</>
				)
			}}
		/>
	)
}
