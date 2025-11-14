import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<svg
			className={cn('size-16', className)}
			xmlns="http://www.w3.org/2000/svg"
			width="223"
			height="87"
			fill="none"
			viewBox="0 0 223 87"
		>
			<path
				fill="currentColor"
				d="M181.868 86.651h-27.906l.127-86.014.127-.637h18.095l-1.656 69.066h1.274L202.767 0h19.751l-.127.637-40.523 86.014Zm-52.578 0H70.036L90.042 0h59.127l-3.568 16.183h-40.267l-4.333 18.732h34.788l-3.44 15.547H97.306l-4.588 20.006h40.14l-3.568 16.183Zm-93.737 0H0L20.006 0H53.01c13.125 0 22.937 5.607 22.937 21.918 0 3.95-.51 8.537-1.784 13.762l-4.205 17.84c-6.88 28.926-17.33 33.131-34.405 33.131Zm-.383-69.83L22.81 69.83h23.7l12.361-53.01H35.17Z"
			/>
		</svg>
	)
}
