'use client'

import React, { use } from 'react'
import Image from 'next/image'
import { FaqItem } from '@/app/faq/_components/faq-item'
import { CldImage } from '@/components/cld-image'
import MDXVideo from '@/components/content/mdx-video'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import type { Page } from '@/lib/pages'
import { formatFaq } from '@/utils/format-faq'
import MuxPlayer from '@mux/mux-player-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { GripVertical } from 'lucide-react'

import { Accordion } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

const YouTubeVideo = ({ videoId }: { videoId: string }) => {
	return (
		<div
			style={{
				position: 'relative',
				paddingBottom: '56.25%',
				height: 0,
				overflow: 'hidden',
				maxWidth: '100%',
			}}
		>
			<iframe
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
				}}
				src={`https://www.youtube.com/embed/${videoId}`}
				title="YouTube video player"
				frameBorder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
			></iframe>
		</div>
	)
}

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
			data-instructor=""
			className={cn(
				'prose-headings:my-0 dark:prose-p:text-violet-100 prose-p:text-violet-950 prose-headings:text-violet-950 dark:prose-headings:text-violet-100 bg-muted relative flex w-full flex-col items-center gap-3 rounded-lg border p-5 sm:gap-10 sm:p-10',
				className,
			)}
		>
			<CldImage
				loading="lazy"
				src="https://res.cloudinary.com/epic-web/image/upload/v1744211741/epicdev.ai/kent-speaking-all-things-open.jpg"
				alt={config.author}
				width={1280}
				height={854}
				className="mb-0! mt-0! w-full flex-shrink-0 rounded-md"
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
				'not-prose font-heading relative mx-auto flex font-medium w-full max-w-3xl flex-col items-start border-l-4 dark:border-gray-800 border-gray-200 mt-5 py-2 pl-5 italic gap-2',
			centered:
				'flex text-center font-heading text-balance flex-col items-center justify-center border-none dark:text-white',
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
					<span className="font-sans text-sm">{authorName}</span>
				</div>
			)}
		</blockquote>
	)
}

const calloutVariants = cva('p-4 rounded-md flex gap-3', {
	variants: {
		variant: {
			default: 'bg-primary/10 border-l-4 border-primary',
			success: 'bg-green-500/10 border-l-4 border-green-500',
			warning: 'bg-amber-500/10 border-l-4 border-amber-500',
			error: 'bg-red-500/10 border-l-4 border-red-500',
			info: 'bg-blue-500/10 border-l-4 border-blue-500',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

const Callout = ({
	children,
	variant = 'default',
	className,
}: {
	children: React.ReactNode
	variant?: VariantProps<typeof calloutVariants>['variant']
	className?: string
}) => {
	return (
		<div className={cn(calloutVariants({ variant }), className)}>
			{children}
		</div>
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
		{
			name: 'Testimonial',
			component: Testimonial,
			props: {
				authorName: 'John Doe',
				authorAvatar: 'http://res.cloudinary.com/TODO',
				children: 'This is my feedback',
				variant: 'centered',
			},
		},
	],
	video: [
		{
			name: 'Video',
			component: MDXVideo,
			props: {},
		},
		{
			name: 'YouTubeVideo',
			component: YouTubeVideo,
			props: {
				videoId: 'YOUTUBE_VIDEO_ID',
			},
		},
	],
	callouts: [
		{
			name: 'Callout',
			component: Callout,
			props: {
				variant: 'default',
			},
		},
		{
			name: 'Callout',
			component: Callout,
			props: {
				variant: 'success',
			},
		},
		{
			name: 'Callout',
			component: Callout,
			props: {
				variant: 'warning',
			},
		},
		{
			name: 'Callout',
			component: Callout,
			props: {
				variant: 'error',
			},
		},
		{
			name: 'Callout',
			component: Callout,
			props: {
				variant: 'info',
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
<${item.name} ${item.name === 'YouTubeVideo' ? 'videoId="YOUTUBE_VIDEO_ID"' : 'resourceId="RESOURCE_ID_FROM_DATABASE"'} />
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
								key={`${item.name}-${item.props.variant}-${index}`}
								item={{
									...item,
									name: `${item.name} (${item.props.variant || 'default'})`,
								}}
								onDragStart={(e) =>
									e.dataTransfer.setData(
										'text/plain',
										`<${item.name} variant="${item.props.variant || 'default'}" authorName="John Doe" authorAvatar="http://res.cloudinary.com/TODO">This is my feedback</${item.name}>`,
									)
								}
							/>
						)
					})}
				</div>
			)}
			{data?.callouts && (
				<div className="flex flex-wrap items-center gap-1">
					<strong className="mb-1">Callouts</strong>
					{data.callouts.map((item, index) => {
						return (
							<BlockItem
								key={`${item.name}-${item.props.variant}-${index}`}
								item={{
									...item,
									name: `${item.name} (${item.props.variant})`,
								}}
								onDragStart={(e) =>
									e.dataTransfer.setData(
										'text/plain',
										`<${item.name} variant="${item.props.variant}">Important information goes here</${item.name}>`,
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
		<div className={cn('flex flex-col gap-5 pt-0', className)}>
			<h2 className="mb-0! px-3 sm:px-5">FAQ</h2>
			<Accordion type="multiple" className="not-prose flex w-full flex-col">
				<ul className="divide-border flex flex-col gap-0 divide-y">
					{formattedQuestions.map(({ question, answer }) => (
						<FaqItem
							className="rounded-none border-none bg-transparent shadow-none hover:bg-transparent dark:border-none dark:bg-transparent dark:hover:bg-transparent"
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
	Spacer,
	Section,
	CheckList,
	MuxPlayer,
	Testimonial,
	Callout,
	YouTubeVideo,
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
	Callout,
	YouTubeVideo,
	FAQ,
}
