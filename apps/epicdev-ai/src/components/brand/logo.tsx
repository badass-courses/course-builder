import { env } from '@/env.mjs'
import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<div
			className={cn(
				'text-foreground flex items-center font-bold tracking-tight',
				className,
			)}
		>
			<span>Epic</span>
			<span className="text-background bg-primary relative ml-0.5 translate-y-[-1px] rotate-[-2deg] rounded px-1 py-0.5 pl-0.5">
				Ai
			</span>
			<span className="ml-0.5">Pro</span>
		</div>
	)
}

export const LogoMark: React.FC<{ className?: string; onDark?: boolean }> = ({
	className = 'w-8',
}) => {
	return <div>todo</div>
}
