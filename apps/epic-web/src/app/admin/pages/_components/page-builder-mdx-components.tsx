'use client'

import React from 'react'
import Image from 'next/image'
import { CldImage } from '@/components/cld-image'
import MDXVideo from '@/components/content/mdx-video'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import MuxPlayer from '@mux/mux-player-react'
import { cva, type VariantProps } from 'class-variance-authority'
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

const SubscribeForm = ({
	title,
	byline,
	actionLabel,
	formId,
}: {
	title: string
	byline: string
	actionLabel: string
	formId: number
}) => {
	return (
		<PrimaryNewsletterCta
			className="not-prose w-full"
			formId={formId}
			title={title}
			byline={byline}
			actionLabel={actionLabel}
		/>
	)
}

const Instructor = ({
	className,
	children,
	title,
}: {
	className?: string
	children?: React.ReactNode
	title?: string
}) => {
	return (
		<section
			className={cn(
				'prose-headings:my-0 relative flex w-full flex-col items-center gap-10 py-5',
				className,
			)}
		>
			<CldImage
				loading="lazy"
				src="https://res.cloudinary.com/epic-web/image/upload/v1744211741/epicdev.ai/kent-speaking-all-things-open.jpg"
				alt={config.author}
				width={1280}
				height={854}
				className="mb-0! flex-shrink-0 rounded-md"
			/>

			<div className="">
				<h3 className="">{title || config.author}</h3>
				<div className="flex flex-col gap-3">{children}</div>
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
	ctas: [
		{
			name: 'PrimaryNewsletterCta',
			component: PrimaryNewsletterCta,
			props: {
				title: 'Primary Newsletter Title',
				byline: 'Primary Newsletter Byline',
				actionLabel: 'Subscribe',
			},
		},
		{
			name: 'SubscribeForm',
			component: SubscribeForm,
			props: {
				title: 'Subscribe to this event',
				byline: 'Get the latest news and updates from me',
				subscribedTitle: 'You are subscribed, thanks!',
				subscribedSubtitle: 'We will notify you when the event is live',
				actionLabel: 'Subscribe',
				formId: 123,
				onSuccess: (router: any) => {
					router.push('/')
				},
			},
		},
	],
	lists: [
		{
			name: 'CheckList',
			component: CheckList,
			props: {},
		},
	],
	instructor: [
		{
			name: 'Instructor',
			component: Instructor,
			props: {
				title: 'Kent C. Dodds',
			},
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
	video: [
		{
			name: 'Video',
			component: MDXVideo,
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
		<div className="flex flex-col gap-4">
			{data?.ctas && (
				<div className="flex flex-wrap items-center gap-1">
					<strong className="mb-1">CTAs</strong>
					{data?.ctas?.map((item, index) => {
						return (
							<BlockItem
								key={item.name}
								item={item}
								onDragStart={(e) =>
									e.dataTransfer.setData(
										'text/plain',
										`<${item.name} ${Object.entries(item.props)
											.map(([key, value]) => `${key}="${value}"`)
											.join(' ')} />`,
									)
								}
							/>
						)
					})}
				</div>
			)}
			{data?.video && (
				<div className="flex flex-wrap items-center gap-1">
					<strong className="mb-1">Video</strong>
					{data?.video?.map((item, index) => {
						return (
							<BlockItem
								key={item.name}
								item={item}
								onDragStart={(e) =>
									e.dataTransfer.setData(
										'text/plain',
										`
<${item.name} resourceId="RESOURCE_ID_FROM_DATABASE" />
`,
									)
								}
							/>
						)
					})}
				</div>
			)}

			{data?.instructor && (
				<div className="flex flex-wrap items-center gap-1">
					<strong className="mb-1">Instructor</strong>
					{data?.instructor?.map((item, index) => {
						return (
							<BlockItem
								key={item.name}
								item={item}
								onDragStart={(e) =>
									e.dataTransfer.setData(
										'text/plain',
										`
<${item.name} title="Kent C. Dodds">

Kent C. Dodds is a world renowned speaker, teacher, and trainer and he's actively involved in the open source community as a maintainer and contributor of hundreds of popular npm packages. He is the creator of EpicReact.Dev and TestingJavaScript.com. He's an instructor on egghead.io and Frontend Masters. He's also a Google Developer Expert. Kent is happily married and the father of four kids. He likes his family, code, JavaScript, and Remix.

</${item.name}>
`,
									)
								}
							/>
						)
					})}
				</div>
			)}
			{data?.testimonial && (
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
			)}
		</div>
	)
}

// These are all passed down to the Preview component so need to match with options above

const allMdxPageBuilderComponents = {
	CenteredTitle,
	Instructor,
	Spacer,
	Section,
	CheckList,
	MuxPlayer,
	Testimonial,
}

export {
	CenteredTitle,
	Instructor,
	Spacer,
	Section,
	CheckList,
	allMdxPageBuilderComponents,
	PageBlocks,
	Testimonial,
	SubscribeForm,
}
