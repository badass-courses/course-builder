'use client'

import React, { use } from 'react'
import { FaqItem } from '@/app/faq/_components/faq-item'
import { AnimatedTitle } from '@/components/brand/animated-word'
import { CldImage } from '@/components/cld-image'
import config from '@/config'
import type { Page } from '@/lib/pages'
import { formatFaq } from '@/utils/format-faq'
import MuxPlayer from '@mux/mux-player-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { GripVertical, ZoomIn } from 'lucide-react'
import { useTheme } from 'next-themes'

import {
	Accordion,
	Button,
	Dialog,
	DialogContent,
	DialogTrigger,
} from '@coursebuilder/ui'
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
				'bg-foreground/5 first-of-type:prose-headings:mt-4 -mx-5 px-5 py-5',
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

const Instructor = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	return (
		<section
			className={cn(
				'not-prose relative flex w-full flex-col items-center gap-16 border-y px-5 py-16 lg:flex-row lg:px-16',
				className,
			)}
		>
			<CldImage
				loading="lazy"
				src="https://res.cloudinary.com/total-typescript/image/upload/v1741011187/aihero.dev/assets/matt-in-new-studio-square_2x_hutwgm.png"
				alt={config.author}
				width={290}
				height={290}
				className="shrink-0 rotate-2"
			/>

			<div className="">
				<h3 className="mb-5 text-3xl font-bold">Hi, I'm {config.author}</h3>
				<div className="flex flex-col gap-3 text-xl leading-relaxed">
					{children}
				</div>
			</div>
		</section>
	)
}

const CheckList = ({ children }: { children: React.ReactNode }) => {
	return <ul data-checklist="">{children}</ul>
}

const testimonialVariants = cva('', {
	variants: {
		variant: {
			default:
				'not-prose relative mx-auto flex w-full max-w-3xl flex-col items-start border-l-4 border-primary pl-5 italic gap-2',
			centered:
				'flex text-center text-balance flex-col items-center justify-center border-none dark:text-white',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

const Testimonial = ({
	children,
	authorName,
	authorAvatar,
	variant = 'default',
}: {
	children: React.ReactNode
	authorName: string
	authorAvatar: string
	variant?: VariantProps<typeof testimonialVariants>['variant']
}) => {
	return (
		<blockquote className={cn(testimonialVariants({ variant }))}>
			{children}
			{authorName && (
				<div className="text-muted-foreground flex items-center gap-2 text-[80%] font-normal not-italic">
					{authorAvatar && authorAvatar.includes('res.cloudinary') && (
						<CldImage
							alt={authorName}
							width={40}
							className="m-0! rounded-full"
							height={40}
							src={authorAvatar}
						/>
					)}
					<span className="font-mono text-sm">{authorName}</span>
				</div>
			)}
		</blockquote>
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
	lists: [
		{
			name: 'CheckList',
			component: CheckList,
			props: {},
		},
	],
	testimonial: [
		{
			name: 'Testimonial',
			component: Testimonial,
			props: {
				authorName: 'John Doe',
				authorAvatar: 'http://res.cloudinary.com/TODO',
				children: 'This is my feedback',
			},
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
		<div className="flex flex-col gap-4">
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
				<strong className="mb-1">Lists</strong>
				{data.lists.map((item, index) => {
					return (
						<BlockItem
							key={item.name}
							item={item}
							onDragStart={(e) =>
								e.dataTransfer.setData(
									'text/plain',
									`
<ul data-checklist="">
- List Item 1
- List Item 2
- List Item 3
</ul>
`,
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
								e.dataTransfer.setData(
									'text/plain',
									`
<${item.name}>

Before creating AI Hero, I created Total TypeScript - the industry standard course for learning TS.

I was a member of the XState core team, and was a developer advocate at Vercel.

I'm building AI Hero to make the secrets of the AI Engineer available to everyone.

</${item.name}>
`,
								)
							}
						/>
					)
				})}
			</div>
			<div className="flex flex-wrap items-center gap-1">
				<strong className="mb-1">Testimonials</strong>
				{data.testimonial.map((item, index) => {
					return (
						<BlockItem
							key={item.name}
							item={item}
							onDragStart={(e) =>
								e.dataTransfer.setData(
									'text/plain',
									`<${item.name} authorName="John Doe" authorAvatar="http://res.cloudinary.com/TODO">This is my feedback</${item.name}>`,
								)
							}
						/>
					)
				})}
			</div>
		</div>
	)
}

type AIPracticesGridProps = {
	items: string[]
	className?: string
}

/**
 * A grid component that displays AI practices with large letter backgrounds
 * Each item is displayed with its first letter as a large background element
 */
const AIPracticesGrid: React.FC<AIPracticesGridProps> = ({
	items,
	className,
}) => {
	return (
		<div
			className={cn(
				'not-prose divide-border -mx-px -my-px grid w-full border-collapse grid-cols-2 divide-x divide-y border-b md:grid-cols-2 lg:grid-cols-3',
				className,
			)}
		>
			{items.map((item, index) => {
				const letters = ['a', 'i', 'h', 'e', 'r', 'o']
				return (
					<div
						key={item}
						className={cn(
							'bg-linear-to-b group relative flex h-56 items-center justify-center from-white to-gray-100 text-center first-of-type:border-l first-of-type:border-t dark:from-gray-900 dark:to-gray-950',
						)}
					>
						<PatternElement
							className={cn('absolute -right-2', {
								'sm:opacity-0': [2, 5].includes(index),
								'opacity-0': [1, 3, 5].includes(index),
							})}
						/>
						<svg
							aria-hidden="true"
							className={cn(
								'text-primary absolute bottom-[-4.5px] right-[-4.5px] z-10 opacity-0',
								{
									'lg:opacity-100': [0, 1].includes(index),
									'lg:opacity-0': [2].includes(index),
									'opacity-100': [0, 2].includes(index),
								},
							)}
							width="8"
							height="8"
							viewBox="0 0 8 8"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M6.74701 7.48108L0.559456 1.29353L0.366897 0.366989L1.26911 0.53522L7.48091 6.74702L7.63292 7.63301L6.74701 7.48108Z"
								fill="currentColor"
							/>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M1.25324 7.48108L7.44079 1.29353L7.63335 0.366989L6.73114 0.53522L0.519338 6.74702L0.367326 7.63301L1.25324 7.48108Z"
								fill="currentColor"
							/>
						</svg>

						{/* Large background letter */}
						<span className="text-foreground/5 absolute flex select-none items-center justify-center font-mono text-[150px] font-bold uppercase">
							{letters[index]}
						</span>

						{/* Item text */}

						<h3 className="z-10 text-xl font-semibold leading-none lg:text-2xl">
							{item}
						</h3>
					</div>
				)
			})}
		</div>
	)
}

const PatternElement = ({ className }: { className?: string }) => {
	const { resolvedTheme } = useTheme()
	const [isMounted, setIsMounted] = React.useState(false)

	React.useEffect(() => {
		setIsMounted(true)
	}, [])

	return isMounted ? (
		<CldImage
			src={
				resolvedTheme === 'light'
					? 'https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-light-r_2x_y6fcsw.png'
					: 'https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-dark-r_2x_wytllo.png'
			}
			width={16}
			height={35}
			alt=""
			className={cn('', className)}
		/>
	) : null
}

const ShinyText = ({
	children,
	text,
	disabled = false,
	speed = 5,
	className = '',
}: {
	children?: React.ReactNode
	text?: string
	disabled?: boolean
	speed?: number
	className?: string
}) => {
	const animationDuration = `${speed}s`

	return (
		<span
			className={cn(
				className,
				'inline-block bg-[linear-gradient(120deg,rgba(0,0,0,0)40%,rgba(0,0,0,1)50%,rgba(0,0,0,0)60%)] bg-clip-text text-[#000000b1] dark:bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] dark:text-[#ffffffc7]',
				{
					'animate-shine': !disabled,
				},
			)}
			style={{
				// backgroundImage:
				// 	'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0) 60%)',
				backgroundSize: '200% 100%',
				WebkitBackgroundClip: 'text',
				animationDuration: animationDuration,
			}}
		>
			{children || text}
		</span>
	)
}

const FAQ = ({
	faqPageLoader,
	className,
}: {
	faqPageLoader: Promise<Page | null>
	className?: string
}) => {
	const faqPage = use(faqPageLoader)
	if (!faqPage) return null
	const formattedQuestions = formatFaq(faqPage?.fields?.body || '')
	if (!formattedQuestions.length) return null

	return (
		<div
			className={cn(
				'-mb-8 flex flex-col gap-5 border-t pt-0 sm:-mb-16',
				className,
			)}
		>
			<h2 className="mb-5 px-5">FAQ</h2>
			<Accordion
				type="multiple"
				className="not-prose flex w-full flex-col border-t"
			>
				<ul className="divide-border flex list-none flex-col gap-0 divide-y">
					{formattedQuestions.map(({ question, answer }) => (
						<FaqItem
							className="rounded-none border-none bg-transparent hover:bg-transparent dark:border-none dark:bg-transparent dark:hover:bg-transparent"
							question={question}
							answer={answer}
							key={question}
						/>
					))}
				</ul>
			</Accordion>
		</div>
	)
}

const TableWrapper = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="not-prose relative -mx-4 px-4 md:mx-0 md:px-0">
			<div className="bg-background relative">
				<div className="relative z-0 w-full overflow-x-auto pr-10">
					<div className="[&_tr:not(:last-child)_td]:border-border min-w-max [&_code]:text-xs [&_table]:w-auto [&_table]:border-separate [&_table]:border-spacing-0 [&_td]:min-w-[100px] [&_td]:px-2 [&_td]:py-2 [&_td]:align-top [&_td]:text-sm [&_td_code]:whitespace-normal [&_td_code]:break-words [&_th]:min-w-[100px] [&_th]:px-2 [&_th]:py-2 [&_th]:text-left [&_th]:align-top [&_th]:text-sm [&_th]:font-semibold [&_th_code]:whitespace-normal [&_th_code]:break-words [&_tr:not(:last-child)_td]:border-b">
						{children}
					</div>
				</div>
				{/* <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-20 w-4 bg-gradient-to-r to-transparent" /> */}
				<div className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l to-transparent" />
			</div>
			<Dialog>
				<DialogTrigger asChild>
					<Button
						size="icon"
						variant="outline"
						className="absolute -top-5 right-0 z-20"
					>
						<ZoomIn />
						<span className="sr-only">View Table</span>
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-none sm:max-w-[90%]">
					<div className="relative w-full overflow-x-auto pb-5">
						<div className="[&_tr:not(:last-child)_td]:border-border min-w-max [&_code]:text-sm [&_table]:w-auto [&_table]:border-separate [&_table]:border-spacing-0 [&_td]:min-w-[100px] [&_td]:px-2 [&_td]:py-2 [&_td]:align-top [&_td]:text-base [&_th]:min-w-[100px] [&_th]:px-2 [&_th]:py-2 [&_th]:text-left [&_th]:align-top [&_th]:text-sm [&_th]:font-semibold [&_thead_th:nth-child(1)]:w-[400px] [&_thead_th:nth-child(2)]:w-[220px] [&_thead_th:nth-child(3)]:w-[300px] [&_thead_th:nth-child(4)]:w-[300px] [&_tr:not(:last-child)_td]:border-b">
							{children}
						</div>
					</div>
				</DialogContent>
			</Dialog>
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
	CheckList,
	MuxPlayer,
	Testimonial,
	AnimatedTitle,
	ShinyText,
}

export {
	CenteredTitle,
	Instructor,
	BlueSection,
	Spacer,
	Section,
	CheckList,
	allMdxPageBuilderComponents,
	PageBlocks,
	Testimonial,
	AIPracticesGrid,
	ShinyText,
	FAQ,
	TableWrapper,
}
