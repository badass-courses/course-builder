'use client'

import Image from 'next/image'
import config from '@/config'
import MuxPlayer from '@mux/mux-player-react'
import { GripVertical } from 'lucide-react'

import { cn } from '@coursebuilder/ui/utils/cn'

const CenteredTitle = ({
	as: Component = 'h2',
	children,
	...props
}: {
	as?: React.ElementType
	children: React.ReactNode
}) => {
	return (
		<Component {...props} className="text-center">
			{children}
		</Component>
	)
}

const Section = ({
	children,
	...props
}: {
	children: React.ReactNode
	className?: string
}) => {
	return (
		<section
			className={cn(
				'bg-foreground/5 prose-headings:first-of-type:mt-4 -mx-5 px-5 py-5',
				props.className,
			)}
			{...props}
		>
			{children}
		</section>
	)
}

const Spacer = ({
	variant = 'default',
}: {
	variant: 'default' | 'sm' | 'lg'
}) => {
	return (
		<div
			aria-hidden="true"
			className={cn('flex', {
				'h-5': variant === 'sm',
				'h-10': variant === 'default',
				'h-16': variant === 'lg',
			})}
		/>
	)
}

const BlueSection = ({
	title,
	children,
	...props
}: {
	title: string
	children: React.ReactNode
	className?: string
}) => {
	return (
		<section
			data-theme="elysium"
			className={cn(
				'bg-muted text-muted-foreground -mx-5 px-5 py-5',
				props.className,
			)}
			{...props}
		>
			<h2>{title}</h2>
			{children}
		</section>
	)
}

const Instructor = ({ className }: { className?: string }) => {
	return (
		<section
			className={cn(
				'not-prose relative mx-auto my-8 flex w-full max-w-screen-md items-center gap-5 sm:flex-row',
				className,
			)}
		>
			<Image
				src={'/matt-pocock.jpg'}
				alt={config.author}
				width={200}
				height={200}
				className="rounded"
			/>

			<div className="">
				<h3 className="text-2xl font-bold">Your Instructor</h3>
				<div
				// className="flex flex-col gap-4 text-lg leading-relaxed"
				>
					<p>TODO</p>
				</div>
			</div>
		</section>
	)
}

const data = {
	layout: [
		{
			name: 'Spacer',
			component: Spacer,
			props: {
				variant: 'default',
			},
		},
	],
	typography: [
		{
			name: 'CenteredTitle',
			component: CenteredTitle,
			props: {
				as: 'h2',
				children: 'Centered Title',
			},
		},
	],
	sections: [
		{
			name: 'Section',
			component: Section,
			props: {
				title: 'Section Title',
				children: 'Section Content',
			},
		},
		{
			name: 'BlueSection',
			component: BlueSection,
			props: {
				title: 'Section Title',
				children: 'Section Content',
			},
		},
	],
	instructor: [
		{
			name: 'Instructor',
			component: Instructor,
			props: {},
		},
	],
}

const BlockItem = ({
	item,
	onDragStart,
}: {
	item: {
		name: string
		component: React.FC<any>
		props: any
	}
	onDragStart: (e: any) => void
}) => {
	return (
		<div
			draggable
			onDragStart={onDragStart}
			className="bg-foreground/5 hover:bg-foreground/10 flex h-8 w-full cursor-move items-center justify-between gap-2 rounded border px-3 transition"
		>
			{item.name}
			<GripVertical className="h-4 w-4 opacity-50" />
		</div>
	)
}

const PageBlocks = () => {
	return (
		<div className="flex flex-col gap-4 ">
			<div className="flex flex-wrap items-center gap-1">
				<strong className="mb-1">Layout</strong>
				{data.layout.map((item, index) => {
					return (
						<BlockItem
							key={item.name}
							item={item}
							onDragStart={(e) =>
								e.dataTransfer.setData('text/plain', `<${item.name} />`)
							}
						/>
					)
				})}
			</div>
			<div className="flex flex-wrap items-center gap-1">
				<strong className="mb-1">Typography</strong>
				{data.typography.map((item, index) => {
					return (
						<BlockItem
							key={item.name}
							item={item}
							onDragStart={(e) =>
								e.dataTransfer.setData(
									'text/plain',
									`<${item.name}>${item.name}</${item.name}>`,
								)
							}
						/>
					)
				})}
			</div>
			<div className="flex flex-wrap items-center gap-1">
				<strong className="mb-1">Sections</strong>
				{data.sections.map((item, index) => {
					return (
						<BlockItem
							key={item.name}
							item={item}
							onDragStart={(e) =>
								e.dataTransfer.setData(
									'text/plain',
									`<${item.name}>${item.name}</${item.name}>`,
								)
							}
						/>
					)
				})}
			</div>
			<div className="flex flex-wrap items-center gap-1">
				<strong className="mb-1">Instructor</strong>
				{data.instructor.map((item, index) => {
					return (
						<BlockItem
							key={item.name}
							item={item}
							onDragStart={(e) =>
								e.dataTransfer.setData('text/plain', `<${item.name} />`)
							}
						/>
					)
				})}
			</div>
		</div>
	)
}

// These are all passed down to the Preview component so need to match with options above

const allMdxPageBuilderComponents = {
	CenteredTitle,
	Instructor,
	BlueSection,
	Spacer,
	Section,
	MuxPlayer,
}

export {
	CenteredTitle,
	Instructor,
	BlueSection,
	Spacer,
	Section,
	allMdxPageBuilderComponents,
	PageBlocks,
}
