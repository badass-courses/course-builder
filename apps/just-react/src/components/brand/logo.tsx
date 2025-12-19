import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<div className="flex flex-col text-nowrap text-[20px] font-bold leading-none tracking-tight">
			<div>Just React</div>
			<div className="text-[13.5px] font-normal opacity-75">by Dan Abramov</div>
		</div>
	)
}
