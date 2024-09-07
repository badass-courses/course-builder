import * as React from 'react'
import { cn } from '@/utils/cn'

export async function Layout({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<div
			id="layout"
			className={cn(
				'relative flex flex-grow flex-col pt-[48px] sm:pt-12',
				className,
			)}
		>
			{children}
		</div>
	)
}
