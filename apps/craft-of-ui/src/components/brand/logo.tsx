import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<div
			className={cn(
				'text-foreground flex items-end gap-1.5 font-bold tracking-tight',
				className,
			)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="w-5"
				fill="none"
				viewBox="0 0 20 16"
			>
				<path fill="currentColor" d="M.5 0H20L10 15.5v-10L.5 0Z" opacity=".5" />
				<path fill="currentColor" d="M20 0 10 5.5.5 0H20Z" />
			</svg>
			The Craft of UI
		</div>
	)
}

export const LogoMark: React.FC<{ className?: string; onDark?: boolean }> = ({
	className = 'w-8',
}) => {
	return <div>todo</div>
}
