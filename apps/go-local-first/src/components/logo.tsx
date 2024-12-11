import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string; onDark?: boolean }> = ({
	className,
	onDark = false,
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className={cn(className)}
			width={className ? undefined : 79}
			height={className ? undefined : 39}
			fill="none"
			viewBox="0 0 79 39"
		>
			<path
				fill="currentColor"
				d="M59.886 38.229C70.442 38.229 79 29.67 79 19.115 79 8.557 70.442 0 59.886 0 49.328 0 40.77 8.558 40.77 19.114c0 10.557 8.558 19.115 19.114 19.115ZM17.208.009C7.545.964 0 9.117 0 19.028c0 10.556 8.559 19.114 19.114 19.114 9.911 0 18.064-7.545 19.02-17.208.105-1.051-.76-1.906-1.816-1.906H21.026a1.91 1.91 0 0 1-1.912-1.912V1.825c0-1.057-.855-1.921-1.906-1.816Z"
			/>
		</svg>
	)
}

export const LogoMark: React.FC<{ className?: string; onDark?: boolean }> = ({
	className = 'w-8',
	onDark = false,
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className={cn(className)}
			width={className ? undefined : 79}
			height={className ? undefined : 39}
			fill="none"
			viewBox="0 0 79 39"
		>
			<path
				fill="currentColor"
				d="M59.886 38.229C70.442 38.229 79 29.67 79 19.115 79 8.557 70.442 0 59.886 0 49.328 0 40.77 8.558 40.77 19.114c0 10.557 8.558 19.115 19.114 19.115ZM17.208.009C7.545.964 0 9.117 0 19.028c0 10.556 8.559 19.114 19.114 19.114 9.911 0 18.064-7.545 19.02-17.208.105-1.051-.76-1.906-1.816-1.906H21.026a1.91 1.91 0 0 1-1.912-1.912V1.825c0-1.057-.855-1.921-1.906-1.816Z"
			/>
		</svg>
	)
}
