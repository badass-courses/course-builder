'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSaleBanner from '@/hooks/use-sale-banner'
import { cn } from '@/utils/cn'
import pluralize from 'pluralize'
import Countdown from 'react-countdown'

export default function SaleBanner({ className }: { className?: string }) {
	const saleBanner = useSaleBanner()
	const pathname = usePathname()
	const isOnHomePage = pathname === '/'

	return saleBanner ? (
		<div className="flex items-center">
			<Link
				href="/#buy"
				className={cn(
					'bg-primary text-primary-foreground mr-3 flex w-full items-center justify-center rounded text-sm font-semibold shadow',
					{},
					className,
				)}
			>
				<div className="flex flex-col rounded-l bg-black/10 px-3 py-2 text-xs leading-none shadow-inner">
					<div className="">{saleBanner.percentageOff}% off</div>
					<div className="text-[9px]">
						{saleBanner.defaultCoupon?.expires && (
							<Countdown
								date={saleBanner.defaultCoupon.expires}
								renderer={({ days, hours, minutes, seconds, completed }) => {
									if (completed) {
										return null
									}
									return (
										<div>
											{days >= 1 && `${days} ${pluralize('day', days)} left`}
											{days === 0 &&
												hours > 0 &&
												`${hours} ${pluralize('hour', hours)} left`}
											{days === 0 &&
												hours === 0 &&
												minutes > 0 &&
												`${minutes} ${pluralize('minute', minutes)} left`}
											{days === 0 &&
												hours === 0 &&
												minutes === 0 &&
												`${seconds} ${pluralize('second', seconds)} left`}
										</div>
									)
								}}
							/>
						)}
					</div>
				</div>
				<div className="px-3 py-2">Get Access</div>
			</Link>
		</div>
	) : null
}
