import { env } from '@/env.mjs'
import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<div
			className={cn(
				'text-primary flex items-center gap-2 font-bold tracking-tight',
				className,
			)}
		>
			Epic <span className="text-foreground -mx-1 font-mono">AI</span>{' '}
			<span className="text-foreground">Dev</span>
		</div>
	)
}

export const LogoMark: React.FC<{ className?: string; onDark?: boolean }> = ({
	className = 'w-8',
}) => {
	return <div>todo</div>
}
