'use client'

import React, { use } from 'react'
import { FaqItem } from '@/app/faq/_components/faq-item'
import { AnimatedTitle } from '@/components/brand/animated-word'
import { CldImage, ThemeImage } from '@/components/cld-image'
import MDXVideo from '@/components/content/mdx-video'
import config from '@/config'
import type { Page } from '@/lib/pages'
import { formatFaq } from '@/utils/format-faq'
import MuxPlayer from '@mux/mux-player-react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
	GitBranch,
	GripVertical,
	Lightbulb,
	RotateCcw,
	ZoomIn,
} from 'lucide-react'
import { useTheme } from 'next-themes'

import {
	Accordion,
	Button,
	Dialog,
	DialogContent,
	DialogTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
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

/**
 * Wraps a codeblock and blurs it initially with a reveal button
 * The codeblock should already have a copy button
 */
const Spoiler = ({ children }: { children: React.ReactNode }) => {
	const [isRevealed, setIsRevealed] = React.useState(false)

	return (
		<div className="not-prose relative -mx-4 px-4 md:mx-0 md:px-0">
			<div className="relative">
				<div
					aria-hidden={!isRevealed}
					className={cn('transition-all duration-300', {
						'pointer-events-none select-none blur-md': !isRevealed,
					})}
				>
					{children}
				</div>
				{!isRevealed && (
					<button
						onClick={() => setIsRevealed(true)}
						className="hover:ring-foreground/5 group absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-lg bg-transparent ring-2 ring-transparent transition-all duration-500"
						aria-label="Reveal solution code"
					>
						<Button
							variant="outline"
							asChild
							className="dark:group-hover:bg-input/60 hover:bg-input/60 group-md rounded-lg transition-all duration-300 hover:bg-white group-hover:bg-white"
						>
							<span>Reveal Solution</span>
						</Button>
					</button>
				)}
				<div aria-live="polite" aria-atomic="true" className="sr-only">
					{isRevealed && 'Solution code revealed'}
				</div>
			</div>
		</div>
	)
}

const Recommendation = ({
	children,
	exerciseId,
}: {
	children?: React.ReactNode
	exerciseId: string
}) => {
	const [resetCopied, setResetCopied] = React.useState(false)
	const [cherryPickCopied, setCherryPickCopied] = React.useState(false)

	const resetCommand = `pnpm reset ${exerciseId}`
	const cherryPickCommand = `pnpm cherry-pick ${exerciseId}`

	const handleCopyReset = async () => {
		await navigator.clipboard.writeText(resetCommand)
		setResetCopied(true)
		setTimeout(() => setResetCopied(false), 2000)
	}

	const handleCopyCherryPick = async () => {
		await navigator.clipboard.writeText(cherryPickCommand)
		setCherryPickCopied(true)
		setTimeout(() => setCherryPickCopied(false), 2000)
	}
	return (
		<div className="not-prose relative -mx-4 px-4 md:mx-0 md:px-0">
			<div className="bg-muted mt-2 rounded-lg border p-4">
				<div className="flex items-start gap-3">
					<Lightbulb className="text-primary mt-0.5 h-5 w-5 shrink-0" />
					<div className="flex-1">
						<div className="mb-1 text-sm font-semibold">Recommendation:</div>
						<p className="text-muted-foreground text-sm">{children}</p>
					</div>
				</div>
			</div>
			<TooltipProvider delayDuration={0}>
				<div className="mt-2 grid w-full grid-cols-1 items-center gap-2 md:grid-cols-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopyReset}
								className="group relative h-9 gap-2 rounded-lg hover:cursor-pointer"
							>
								<RotateCcw className="h-4 w-4" />
								<span className="font-mono text-sm">{resetCommand}</span>
								{resetCopied && (
									<span className="text-muted-foreground bg-background absolute inset-0 flex items-center justify-center gap-2 rounded-lg font-mono text-sm">
										Copied!
									</span>
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							className="max-w-xs rounded-lg text-center"
						>
							Copy to clipboard a command that resets your project to match a
							specific commit (guided experience).
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopyCherryPick}
								className="group relative h-9 gap-2 rounded-lg hover:cursor-pointer"
							>
								<GitBranch className="h-4 w-4" />
								<span className="font-mono text-sm">{cherryPickCommand}</span>
								{cherryPickCopied && (
									<span className="text-muted-foreground bg-background absolute inset-0 flex items-center justify-center gap-2 rounded-lg font-mono text-sm">
										Copied!
									</span>
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							className="max-w-xs rounded-lg text-center"
						>
							Copy to clipboard a command that cherry-picks changes from a
							specific commit (for custom builds).
						</TooltipContent>
					</Tooltip>
				</div>
			</TooltipProvider>
		</div>
	)
}

/**
 * Displays a video player with command buttons and recommendation section
 * Command buttons copy pnpm commands to clipboard for resetting or cherry-picking exercises
 */
const ProjectVideo = ({
	children,
	resourceId,
	exerciseId,
	recommendation,
}: {
	children?: React.ReactNode
	resourceId: string
	exerciseId: string
	recommendation: string
}) => {
	const [resetCopied, setResetCopied] = React.useState(false)
	const [cherryPickCopied, setCherryPickCopied] = React.useState(false)

	const resetCommand = `pnpm reset ${exerciseId}`
	const cherryPickCommand = `pnpm cherry-pick ${exerciseId}`

	const handleCopyReset = async () => {
		await navigator.clipboard.writeText(resetCommand)
		setResetCopied(true)
		setTimeout(() => setResetCopied(false), 2000)
	}

	const handleCopyCherryPick = async () => {
		await navigator.clipboard.writeText(cherryPickCommand)
		setCherryPickCopied(true)
		setTimeout(() => setCherryPickCopied(false), 2000)
	}

	return (
		<div className="not-prose relative -mx-4 px-4 md:mx-0 md:px-0">
			<MDXVideo resourceId={resourceId} className="mb-0" />
			<TooltipProvider delayDuration={0}>
				<div className="mt-2 grid w-full grid-cols-1 items-center gap-2 md:grid-cols-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopyReset}
								className="group relative h-9 gap-2 rounded-lg hover:cursor-pointer"
							>
								<RotateCcw className="h-4 w-4" />
								<span className="font-mono text-sm">{resetCommand}</span>
								{resetCopied && (
									<span className="text-muted-foreground bg-background absolute inset-0 flex items-center justify-center gap-2 rounded-lg font-mono text-sm">
										Copied!
									</span>
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							className="max-w-xs rounded-lg text-center"
						>
							Copy to clipboard a command that resets your project to match a
							specific commit (guided experience).
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopyCherryPick}
								className="group relative h-9 gap-2 rounded-lg hover:cursor-pointer"
							>
								<GitBranch className="h-4 w-4" />
								<span className="font-mono text-sm">{cherryPickCommand}</span>
								{cherryPickCopied && (
									<span className="text-muted-foreground bg-background absolute inset-0 flex items-center justify-center gap-2 rounded-lg font-mono text-sm">
										Copied!
									</span>
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							className="max-w-xs rounded-lg text-center"
						>
							Copy to clipboard a command that cherry-picks changes from a
							specific commit (for custom builds).
						</TooltipContent>
					</Tooltip>
				</div>
			</TooltipProvider>
			{recommendation && (
				<div className="bg-muted mt-2 rounded-lg border p-4">
					<div className="flex items-start gap-3">
						<Lightbulb className="text-primary mt-0.5 h-5 w-5 shrink-0" />
						<div className="flex-1">
							<div className="mb-1 text-sm font-semibold">Recommendation:</div>
							<p className="text-muted-foreground text-sm">{recommendation}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

const data = {
	content: [
		{
			name: 'Video',
			component: MDXVideo,
			description:
				'Displays an inline video player. Requires resourceId (content resource ID) and optional thumbnailTime. You can also use the Videos tab to drag and drop a video resource into the editor.',
			props: {
				resourceId: '123',
			},
		},
		{
			name: 'CldImage',
			component: CldImage,
			description:
				'Displays a Cloudinary image. Requires width, height, and cloudinary image src. Also supports additional Cloudinary image props.',
			props: {
				src: 'https://res.cloudinary.com/total-typescript/image/upload/v1741011187/aihero.dev/assets/matt-in-new-studio-square_2x_hutwgm.png',
				alt: 'Matt in new studio',
				width: 290,
				height: 290,
			},
		},
		{
			name: 'Spoiler',
			component: Spoiler,
			description:
				'Displays a spoiler content, usually a code block with a reveal button. Requires children content.',
			props: {
				children: `This is the spoiler content, usually a code block`,
			},
		},

		{
			name: 'ProjectVideo',
			component: ProjectVideo,
			description:
				'Displays a video player with command buttons and recommendation section. Requires resourceId (content resource ID), exerciseId (e.g. 04.04.01), and recommendation (recommendation text).',
			props: {
				resourceId: '123',
				exerciseId: '04.04.01',
				recommendation:
					'This is an essential commit. Implement it yourself, and use the guides below as a reference.',
			},
		},
		{
			name: 'TableWrapper',
			component: TableWrapper,
			description:
				'Displays a responsive and expandable table. Requires table content.',
			props: {
				children: 'Table Content',
			},
		},
		{
			name: 'Recommendation',
			component: Recommendation,
			description:
				'Displays a recommendation section. Requires children content, exerciseId (e.g. 04.04.01).',
			props: {
				children:
					'This is an essential commit. Implement it yourself, and use the guides below as a reference.',
				exerciseId: '04.04.01',
			},
		},
		{
			name: 'ThemeImage',
			component: ThemeImage,
			description:
				'Displays an image based on the current theme (light or dark). Requires width, height, and urls object with light and dark image src. Also supports additional Cloudinary image props.',
			props: {
				urls: {
					dark: 'https://res.cloudinary.com/total-typescript/image/upload/v1741011187/aihero.dev/assets/matt-in-new-studio-square_2x_hutwgm.png',
					light:
						'https://res.cloudinary.com/total-typescript/image/upload/v1741011187/aihero.dev/assets/matt-in-new-studio-square_2x_hutwgm.png',
				},
				alt: 'Matt in new studio',
				width: 290,
				height: 290,
			},
		},
	],
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
		description?: string
	}
	onDragStart: (e: any) => void
}) => {
	const content = (
		<div
			draggable
			onDragStart={onDragStart}
			className="bg-foreground/5 hover:bg-foreground/10 flex h-8 w-full cursor-move items-center justify-between gap-2 rounded border px-3 transition"
		>
			{item.name}
			<GripVertical className="h-4 w-4 opacity-50" />
		</div>
	)

	if (item.description) {
		return (
			<TooltipProvider delayDuration={0}>
				<Tooltip>
					<TooltipTrigger asChild>{content}</TooltipTrigger>
					<TooltipContent side="left" className="max-w-xs">
						{item.description}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	return content
}

const PageBlocks = () => {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-1">
				<strong className="mb-1">Content</strong>
				{data.content.map((item, index) => {
					return (
						<BlockItem
							key={item.name}
							item={item}
							onDragStart={(e) =>
								e.dataTransfer.setData(
									'text/plain',
									`<${item.name} ${Object.entries(item.props)
										.map(([key, value]) => {
											if (typeof value === 'object' && value !== null) {
												const objectString = Object.entries(value)
													.map(([k, v]) => `${k}: "${v}"`)
													.join(', ')
												return `${key}={{${objectString}}}`
											}
											return `${key}="${String(value)}"`
										})
										.join(' ')} />`,
								)
							}
						/>
					)
				})}
			</div>
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
				<ul className="divide-border [&_li]:list-none! flex flex-col gap-0 divide-y">
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
	Spoiler,
	TableWrapper,
	ProjectVideo,
	Recommendation,
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
	Spoiler,
	ProjectVideo,
	Recommendation,
}
