import { env } from '@/env.mjs'
import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string; withSubtitle?: boolean }> = ({
	className = '',
	withSubtitle = false,
}) => {
	return (
		<div
			className={cn(
				'text-foreground flex items-center font-semibold tracking-tight',
				className,
			)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				// width="186"
				// height="218"
				fill="none"
				viewBox="0 0 186 218"
				className="relative mr-1 size-9 -translate-y-0.5 text-[#251356] dark:text-[#DCDDF7]"
			>
				<path
					fill="url(#a)"
					d="M148.775 105.046c1.7-2.7-.2-6.2-3.3-6.2h-37.259c-2.784 0-4.717-2.774-3.752-5.386l32.511-88.014c1.7-4.5-4.5-7.6-7.1-3.6l-92.8 141.4c-1.7 2.7.2 6.2 3.3 6.2H76.19c3.482 0 5.898 3.471 4.689 6.736l-7.19 19.413c-4.037 10.899-16.418 16.642-25.78 9.756-18.818-13.84-31.035-36.099-31.035-61.205 0-39.332 30.07-71.8 68.534-75.63 1.235-.123 2.366-.777 3.049-1.814l8.197-12.442c.85-1.29-.022-3.026-1.566-3.077a63.94 63.94 0 0 0-2.114-.037c-52.5 0-95 43.7-92.9 96.7 1.647 42.439 32.115 77.836 72.303 87 2.35.536 4.756-.51 6.08-2.525l70.417-107.275h-.1Z"
				/>
				<path
					fill="currentColor"
					d="M136.557 42.233a1.987 1.987 0 0 0-2.92.997l-4.164 11.365c-.515 1.405.088 2.97 1.383 3.719 22.752 13.156 38.118 37.76 38.118 65.832 0 28.27-29.65 70.796-67.55 75.511-1.853.231-3.552 1.203-4.58 2.762l-7.068 10.73c-1.184 1.798-.142 4.209 2.002 4.405 41.602 3.803 94.196-40.107 94.196-93.408 0-26.63-10.621-57.508-49.417-81.913Z"
				/>
				<defs>
					<linearGradient
						id="a"
						x1=".03"
						x2="149.475"
						y1="107.844"
						y2="107.844"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#8D63E9" />
						<stop offset="1" stopColor="#9D9CF9" />
					</linearGradient>
				</defs>
			</svg>

			<span className="font-heading flex flex-col leading-tight text-[#251356] dark:text-[#DCDDF7]">
				<div className="leading-tight">
					Epic <span className="">AI</span>
				</div>
				{withSubtitle && (
					<span className="text-muted-foreground -mt-0.5 text-xs font-normal leading-tight opacity-80">
						by Kent C. Dodds
					</span>
				)}
			</span>
			{/* <span className="text-background bg-primary relative ml-0.5 -translate-y-px -rotate-2 rounded px-1 py-0.5 pl-0.5">
				Ai
			</span> */}
			{/* <span className="ml-0.5">Pro</span> */}
		</div>
	)
}

export const LogoMark: React.FC<{ className?: string; onDark?: boolean }> = ({
	className = 'w-8',
}) => {
	return <div>todo</div>
}
