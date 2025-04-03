import { env } from '@/env.mjs'
import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<div className={cn('flex items-center gap-2', className)}>
			{env.NEXT_PUBLIC_APP_NAME}
		</div>
	)
}

export const LogoMark: React.FC<{ className?: string; onDark?: boolean }> = ({
	className = 'w-8',
}) => {
	return <div>todo</div>
}
