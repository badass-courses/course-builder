import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<div className="flex flex-col text-nowrap text-[20px] font-bold leading-none tracking-tight">
			<div className="font-heading">Just React</div>
			<div className="ml-1.5 font-serif text-[13.5px] font-normal opacity-75">
				Dan Abramov
			</div>
		</div>
	)
}
