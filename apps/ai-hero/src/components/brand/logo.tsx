import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<div className={cn('flex items-center gap-2', className)}>
			<svg
				className="w-7"
				xmlns="http://www.w3.org/2000/svg"
				width={className ? undefined : 280}
				height={className ? undefined : 280}
				fill="none"
				viewBox="0 0 280 280"
			>
				<g clipPath="url(#a)">
					<path
						fill="currentColor"
						fillRule="evenodd"
						d="m284.66-4.72 1.107-.997-18.581-16.725L152 81.242V-1.999h-25v80.54L14.814-22.441-3.715-5.764l-.002-.003-.027.029-.023.021.002.002-16.678 18.529L80.54 125H.115v25h83.127L-20.444 265.186l16.726 18.581L126.594 139-3.266-5.265 141 124.595 274.725 4.223 153.405 139l130.312 144.767 16.726-18.581L196.758 150h83.127v-25h-80.426L300.443 12.814 284.66-4.72Zm1.107 290.438L141 155.406-3.767 285.718l18.58 16.725L127 201.459V280h25v-81.241l115.186 103.684 18.581-16.725Z"
						clipRule="evenodd"
					/>
				</g>
				<defs>
					<clipPath id="a">
						<path fill="#fff" d="M0 0h280v280H0z" />
					</clipPath>
				</defs>
			</svg>
			<span className={cn('leading-none! text-xl font-semibold', {})}>
				<span className="font-mono">AI</span>hero
			</span>
		</div>
	)
}

export const LogoMark: React.FC<{ className?: string; onDark?: boolean }> = ({
	className = 'w-8',
}) => {
	return (
		<svg
			className={cn(className)}
			xmlns="http://www.w3.org/2000/svg"
			width={className ? undefined : 280}
			height={className ? undefined : 280}
			fill="none"
			viewBox="0 0 280 280"
		>
			<g clipPath="url(#a)">
				<path
					fill="currentColor"
					fillRule="evenodd"
					d="m284.66-4.72 1.107-.997-18.581-16.725L152 81.242V-1.999h-25v80.54L14.814-22.441-3.715-5.764l-.002-.003-.027.029-.023.021.002.002-16.678 18.529L80.54 125H.115v25h83.127L-20.444 265.186l16.726 18.581L126.594 139-3.266-5.265 141 124.595 274.725 4.223 153.405 139l130.312 144.767 16.726-18.581L196.758 150h83.127v-25h-80.426L300.443 12.814 284.66-4.72Zm1.107 290.438L141 155.406-3.767 285.718l18.58 16.725L127 201.459V280h25v-81.241l115.186 103.684 18.581-16.725Z"
					clipRule="evenodd"
				/>
			</g>
			<defs>
				<clipPath id="a">
					<path fill="#fff" d="M0 0h280v280H0z" />
				</clipPath>
			</defs>
		</svg>
	)
}
