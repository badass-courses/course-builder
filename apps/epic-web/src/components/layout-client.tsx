'use client'

import { useParams } from 'next/navigation'
import { User } from '@/ability'

import { cn } from '@coursebuilder/ui/utils/cn'

import Navigation from './navigation'
import Footer from './navigation/footer'

/**
 * Client-side layout component that handles container styling and side patterns
 */
export default function LayoutClient({
	children,
	withContainer = false,
	highlightedResource,
	className,
	user,
}: {
	children: React.ReactNode
	withContainer?: boolean
	className?: string
	user?: User | null
	highlightedResource?: {
		path: string
		title: string
	}
}) {
	return (
		<div
			className={cn(
				'',
				{
					'relative mx-auto w-full max-w-[1200px] px-8 sm:px-10': withContainer,
				},
				className,
			)}
		>
			<Navigation
				highlightedResource={highlightedResource}
				withContainer={withContainer}
				user={user}
			/>
			{children}
			<Footer />
		</div>
	)
}

/**
 * Creates a column of repeating SidePattern components
 */
const SidePatternColumn = ({ side }: { side: 'left' | 'right' }) => {
	const flipped = side === 'right'

	return (
		<div className="flex h-full flex-col" aria-hidden="true">
			{/* This will repeat the pattern as many times as needed to fill the container height */}
			<div className="flex flex-1 flex-col">
				{/* {Array.from({ length: 100 }).map((_, index) => (
					<SidePattern key={index} flipped={side === 'right'} />
				))} */}
				<div
					className={cn(
						'h-full w-[8px] bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-light-r_2x_y6fcsw.png)] bg-contain bg-repeat-y sm:w-[16px] dark:bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-dark-r_2x_wytllo.png)]',
					)}
				/>
			</div>
		</div>
	)
}
