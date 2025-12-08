'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import {
	Brain,
	ChevronDown,
	ChevronRight,
	Layers,
	Sparkles,
	Terminal,
	Zap,
} from 'lucide-react'
import { motion, useInView, useScroll, useTransform } from 'motion/react'

import { cn } from '@coursebuilder/ui/utils/cn'

import { CldImage } from '../cld-image'
import TickerScroll from '../ticker-scroll'

/**
 * Animated section wrapper with scroll-triggered reveal
 */
function AnimatedSection({
	children,
	className,
	delay = 0,
	...props
}: {
	children: React.ReactNode
	className?: string
	delay?: number
}) {
	const ref = React.useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-100px' })

	return (
		<motion.section
			ref={ref}
			initial={{ opacity: 0, y: 40 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
			transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
			className={className}
			{...props}
		>
			{children}
		</motion.section>
	)
}

/**
 * Giant section header with monospace label
 */
function SectionHeader({
	label,
	title,
	description,
	className,
}: {
	label?: string
	title: string
	description?: string | React.ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				'mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center',
				className,
			)}
		>
			{label && (
				<span className="bg-primary text-primary-foreground mb-4 flex items-center justify-center px-2 py-1 font-mono text-sm font-medium uppercase tracking-widest">
					{label}
				</span>
			)}
			<h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
				{title}
			</h2>
			{description && (
				<p className="text-muted-foreground mt-6 max-w-2xl text-balance text-xl leading-relaxed">
					{description}
				</p>
			)}
		</div>
	)
}

/**
 * Grid card with icon for tight grid layouts (no gaps, 1px borders)
 */
function GridCard({
	icon,
	title,
	description,
	delay = 0,
	className,
}: {
	icon: React.ReactNode
	title: string
	description: string
	delay?: number
	className?: string
}) {
	const ref = React.useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-50px' })

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
			animate={
				isInView
					? { opacity: 1, y: 0, filter: 'blur(0px)' }
					: { opacity: 0, y: 20, filter: 'blur(8px)' }
			}
			transition={{
				duration: 0.5,
				delay,
				ease: [0.21, 0.47, 0.32, 0.98],
			}}
			className={cn(
				'bg-background group relative flex min-h-[260px] flex-col p-8 transition-colors',
				className,
			)}
		>
			<div className="text-muted-foreground mb-6 flex h-12 w-12 items-center justify-center">
				{icon}
			</div>
			<h3 className="mb-3 text-xl font-semibold tracking-tight">{title}</h3>
			<p className="text-muted-foreground leading-relaxed">{description}</p>
		</motion.div>
	)
}

/**
 * Numbered bullet item with animated reveal
 */
function BulletItem({
	title,
	description,
	index,
}: {
	title: string
	description: string
	index: number
}) {
	const ref = React.useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-50px' })

	return (
		<motion.li
			ref={ref}
			initial={{ opacity: 0, x: -20 }}
			animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
			transition={{
				duration: 0.5,
				delay: index * 0.1,
				ease: [0.21, 0.47, 0.32, 0.98],
			}}
			className="flex gap-6"
		>
			<span className="text-primary font-mono text-lg font-bold">
				{String(index + 1).padStart(2, '0')}
			</span>
			<div>
				<strong className="font-semibold">{title}</strong>
				<span className="text-muted-foreground"> – {description}</span>
			</div>
		</motion.li>
	)
}

/**
 * Expandable details/accordion section
 */
function ExpandableSection({
	title,
	children,
	defaultOpen = false,
}: {
	title: string
	children: React.ReactNode
	defaultOpen?: boolean
}) {
	const [isOpen, setIsOpen] = React.useState(defaultOpen)

	return (
		<div className="">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					'flex w-full items-center justify-between px-5 py-6 text-left transition-colors sm:px-8',
					{
						'hover:bg-muted/50': !isOpen,
					},
				)}
			>
				<span className="text-lg font-semibold">{title}</span>
				<ChevronDown
					className={cn(
						'text-muted-foreground h-5 w-5 transition-transform duration-300',
						isOpen && 'rotate-180',
					)}
				/>
			</button>
			<motion.div
				initial={false}
				animate={{
					height: isOpen ? 'auto' : 0,
					opacity: isOpen ? 1 : 0,
				}}
				transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
				className="overflow-hidden"
			>
				<div className="space-y-35 pb-6 pl-4">{children}</div>
			</motion.div>
		</div>
	)
}

/**
 * Instructor section with image and bio
 */
function InstructorSection() {
	const ref = React.useRef(null)
	const isInView = useInView(ref, { once: true, margin: '-100px' })

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 40 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
			transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
			className="flex flex-col gap-5 sm:gap-16 lg:flex-row"
		>
			<div className="relative shrink-0">
				<div className="relative overflow-hidden">
					<div
						data-theme="purple"
						className="absolute inset-0 opacity-20 mix-blend-color"
					/>
					<CldImage
						src="https://res.cloudinary.com/johnlindquist/image/upload/c_limit,w_1200/f_auto/q_auto/v1745836451/john-lindquist-pro-cursor-ai-avatar_xodtsm?_a=BAVAZGE70"
						alt="John Lindquist"
						width={600}
						height={600}
						className="object-cover"
					/>
				</div>
			</div>
			<div className="flex flex-col items-start justify-center px-5 py-10 pr-5 lg:pr-16">
				<span
					className="bg-foreground text-background mb-4 inline-flex items-center justify-center px-2 py-1 font-mono text-sm font-medium uppercase tracking-widest"
					data-theme="purple"
				>
					Your Instructor
				</span>
				<h3 className="font-heading mb-4 text-3xl font-semibold tracking-tight lg:text-4xl">
					John Lindquist
				</h3>
				<div className="text-muted-foreground space-y-4 text-base leading-relaxed">
					<p>
						John Lindquist is a co‑founder of egghead.io and a pioneer in
						developer education. With a history of teaching through bite-sized,
						high-impact content, John has spent time since the advent of AI
						tools immersed in the bleeding edge of AI development tools.
					</p>
					<p>
						From deep-diving into Cursor&apos;s internals to building custom MCP
						servers and maximizing Claude Code&apos;s potential, he is dedicated
						to mapping the territory of this new era and helping developers
						thrive in it.
					</p>
				</div>
			</div>
		</motion.div>
	)
}

/**
 * Glowing highlight text component
 */
function GlowText({ children }: { children: React.ReactNode }) {
	return (
		<span className="text-primary relative inline-block font-semibold">
			<span className="relative z-10">{children}</span>
			<span
				className="bg-primary/20 absolute inset-0 -z-10 blur-xl"
				aria-hidden="true"
			/>
		</span>
	)
}

/**
 * Main landing content component - all the stuff below the fold
 */
export function LandingContent() {
	const containerRef = React.useRef(null)

	return (
		<div ref={containerRef} className="-mt-px divide-y">
			{/* The Vision Section */}
			<AnimatedSection className="relative overflow-hidden" data-theme="yellow">
				<section data-theme="yellow" className="border-b">
					<div className="px-0! container flex border-x">
						<TickerScroll className="h-20" reverse />
					</div>
				</section>
				<div className="container border-x py-24 sm:py-32">
					<SectionHeader
						label="The Vision"
						title="Limitless Creation"
						description="Software development has always been a trade-off between imagination and implementation. You have a vision, but you get stuck in the mud of configuration and syntax."
						className="text-center md:mx-auto"
					/>
				</div>

				<div className="border-t">
					<div className="container grid gap-5 border-x py-20 text-center sm:py-24 md:grid-cols-2 md:gap-16 md:text-left lg:px-16">
						<h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
							AI changes the physics of creation.
						</h2>
						<p className="text-muted-foreground mt-4 max-w-2xl text-balance text-xl leading-relaxed">
							We don&apos;t view AI as a manager delegating tasks. We view it as
							a <strong className="text-foreground">creative multiplier</strong>
							—a partner that allows you to explore ideas faster than you can
							type them.
						</p>
					</div>
				</div>
			</AnimatedSection>
			<div className="" data-theme="yellow">
				<div className="px-0! container border-x">
					<TickerScroll className="h-20 w-full" />
				</div>
			</div>
			{/* Exploration Section */}
			<AnimatedSection className="relative">
				<div className="container border-x py-24 sm:py-32">
					<SectionHeader
						label="Exploration"
						title="Pushing the Boundaries"
						description='The "expert" used to be the person who knew the limitations. The modern creator is the person who finds the possibilities.'
						className="text-center md:mx-auto"
					/>
				</div>
				<div className="border-t">
					<div className="px-0! container border-x">
						<div className="grid grid-cols-1 divide-x divide-y md:grid-cols-3 md:divide-y-0">
							<GridCard
								icon={
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="size-10"
										fill="none"
										viewBox="0 0 24 24"
									>
										<path
											stroke="currentColor"
											strokeLinecap="round"
											strokeWidth="1.5"
											d="M5.143 14A7.822 7.822 0 0 1 4 9.919C4 5.545 7.582 2 12 2s8 3.545 8 7.919A7.82 7.82 0 0 1 18.857 14"
										/>
										<path
											stroke="currentColor"
											strokeWidth="1.5"
											d="M7.383 17.098c-.092-.276-.138-.415-.133-.527a.6.6 0 0 1 .382-.53c.104-.041.25-.041.54-.041h7.656c.291 0 .436 0 .54.04a.6.6 0 0 1 .382.531c.005.112-.041.25-.133.527-.17.511-.255.767-.386.974a1.993 1.993 0 0 1-1.2.869c-.238.059-.506.059-1.043.059h-3.976c-.537 0-.806 0-1.043-.06a1.993 1.993 0 0 1-1.2-.868c-.131-.207-.216-.463-.386-.974ZM15 19l-.13.647c-.14.707-.211 1.06-.37 1.34a2 2 0 0 1-1.113.912C13.082 22 12.72 22 12 22s-1.082 0-1.387-.1a2 2 0 0 1-1.113-.913c-.159-.28-.23-.633-.37-1.34L9 19"
										/>
										<path
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="1.5"
											d="m12.308 12-1.461-4.521A.72.72 0 0 0 10.154 7a.72.72 0 0 0-.693.479L8 12m7-5v5m-6.462-1.5h3.231"
											opacity=".4"
										/>
									</svg>
								}
								title="Curiosity as the Engine"
								description='Use AI to explore every "what if" without friction.'
								delay={0}
							/>
							<GridCard
								icon={
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="size-10"
										fill="none"
										viewBox="0 0 24 24"
									>
										<path
											stroke="currentColor"
											strokeWidth="1.5"
											d="M11.538 8.322a.493.493 0 0 1 .924 0l.712 1.922c.1.27.312.483.582.582l1.922.712a.493.493 0 0 1 0 .924l-1.922.712a.986.986 0 0 0-.582.582l-.712 1.922a.493.493 0 0 1-.924 0l-.712-1.922a.986.986 0 0 0-.582-.582l-1.922-.712a.493.493 0 0 1 0-.924l1.922-.712c.27-.1.483-.312.582-.582l.712-1.922Z"
										/>
										<path
											stroke="currentColor"
											strokeLinecap="round"
											strokeWidth="1.5"
											d="M22 12c0 5.523-4.477 10-10 10m10-10c0-5.523-4.477-10-10-10m10 10h-2.5M12 22C6.477 22 2 17.523 2 12m10 10c-1.79 0-3.327-2.468-4-6m4 6c1.79 0 3.327-2.468 4-6M2 12C2 6.477 6.477 2 12 2M2 12h2.5M12 2c-1.79 0-3.327 2.468-4 6m4-6c1.79 0 3.327 2.468 4 6"
											opacity=".4"
										/>
									</svg>
								}
								title="The Right Tool for the Job"
								description="Seamlessly switch between visual design tools, CLI agents, and deep-thinking architects."
								delay={0.1}
							/>
							<GridCard
								icon={
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="size-10"
										fill="none"
										viewBox="0 0 24 24"
									>
										<path
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="1.5"
											d="M17.407 13.404a.638.638 0 0 1 1.186 0l.037.093a5.1 5.1 0 0 0 2.873 2.873l.093.037a.638.638 0 0 1 0 1.186l-.093.037a5.1 5.1 0 0 0-2.873 2.873l-.037.093a.638.638 0 0 1-1.186 0l-.037-.093a5.1 5.1 0 0 0-2.873-2.873l-.093-.037a.638.638 0 0 1 0-1.186l.093-.037a5.1 5.1 0 0 0 2.873-2.873l.037-.093Z"
										/>
										<path
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="1.5"
											d="M22 11V9c0-2.828 0-4.243-.879-5.121C20.243 3 18.828 3 16 3H8c-2.828 0-4.243 0-5.121.879C2 4.757 2 6.172 2 9c0 2.828 0 4.243.879 5.121C3.757 15 5.172 15 8 15h3"
											opacity=".4"
										/>
										<path
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="1.5"
											d="M6 8v2m9-3v4m-3-2.5v1m6-1v1M9 7v4"
										/>
									</svg>
								}
								title="Multi-Modal Expression"
								description="Use sketches, screenshots, and voice to communicate your intent."
								delay={0.2}
							/>
						</div>
					</div>
					<div className="px-0! border-t">
						<div className="px-0! container border-x">
							<TickerScroll className="h-10 w-full" />
						</div>
					</div>
				</div>
			</AnimatedSection>

			{/* Integration Section - Split Layout */}
			<AnimatedSection className="relative">
				<div className="md:pl-0! container border-x pb-10 md:pb-0">
					<div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
						<div className="relative aspect-square overflow-hidden">
							<Image
								fill
								className="object-cover"
								src="https://res.cloudinary.com/johnlindquist/image/upload/v1763742935/workshops/page-6uceh/waknizj2ce0s93hcqlzk.jpg"
								alt="AI Integration visualization"
							/>
						</div>
						<div>
							<span className="bg-primary text-primary-foreground mb-4 inline-flex items-center justify-center px-2 py-1 font-mono text-sm font-medium uppercase tracking-widest">
								Integration
							</span>
							<h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
								AI as the Bridge
							</h2>
							<div className="text-muted-foreground mt-8 space-y-6 text-lg leading-relaxed">
								<p>
									The most powerful systems start as simple scripts. AI helps
									you bridge the gap between a &quot;hacky script&quot; and a
									&quot;robust tool.&quot;
								</p>
								<p>
									We teach you to build workflows that are adaptable and
									flexible, allowing you to iterate wildly on your own machine,
									then solidify those workflows into reliable tools that your
									whole team can use.
								</p>
							</div>
						</div>
					</div>
				</div>
			</AnimatedSection>

			{/* Self-Improving Workspace Section */}
			<AnimatedSection className="relative" data-theme="blue">
				<div className="container flex flex-col items-center border-x py-24 sm:py-32">
					<SectionHeader
						label="Compound Growth"
						title="The Self-Improving Workspace"
						description="In a traditional workflow, you solve the same problem ten times. In a Compound Growth workflow, you solve it once, and your environment remembers it forever."
					/>
				</div>
				{/* Tight grid layout */}
				<div className="border-y">
					<div className="px-0! container grid grid-cols-1 gap-px divide-y border-x md:divide-x lg:grid-cols-3 lg:divide-y-0">
						<GridCard
							icon={
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="size-10"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										strokeWidth="1.5"
										d="M21.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-8-8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-6-4a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
									/>
									<path
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.5"
										d="m13.5 5 4 5m-3 5.5-4 3m-2.5-1-3-8m1.313-2.846L10.5 4.5m2 7 4.005.344M12 5.5 11 10"
										opacity=".4"
									/>
								</svg>
							}
							title="Harvesting Intelligence"
							description='Learn to mine your agent conversations for reusable "Skills" and "Rules." Every successfully solved ticket becomes a template for the next one.'
							delay={0}
						/>
						<GridCard
							icon={
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="size-10"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										strokeLinejoin="round"
										strokeWidth="1.5"
										d="M11.538 7.253a.547.547 0 0 1 .924 0l.622.978a8.755 8.755 0 0 0 2.685 2.685l.978.622a.547.547 0 0 1 0 .924l-.978.622a8.755 8.755 0 0 0-2.685 2.685l-.622.978a.547.547 0 0 1-.924 0l-.622-.978a8.755 8.755 0 0 0-2.685-2.685l-.978-.622a.547.547 0 0 1 0-.924l.978-.622a8.755 8.755 0 0 0 2.685-2.685l.622-.978Z"
										opacity=".4"
									/>
									<circle
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeLinejoin="round"
										strokeWidth="1.5"
									/>
								</svg>
							}
							title="The Feedback Loop"
							description="We treat logs, errors, and debug sessions as high-value signals. By feeding this data back into your system, you create a self-correcting loop where your tools get more reliable the more you use them."
							delay={0.1}
						/>
						<GridCard
							icon={
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="size-10"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										strokeLinecap="round"
										strokeWidth="1.5"
										d="M11.5 6C7.022 6 4.782 6 3.391 7.172 2 8.343 2 10.229 2 14c0 3.771 0 5.657 1.391 6.828C4.782 22 7.021 22 11.5 22c4.478 0 6.718 0 8.109-1.172C21 19.657 21 17.771 21 14c0-1.17 0-2.158-.041-3"
									/>
									<path
										stroke="currentColor"
										strokeLinejoin="round"
										strokeWidth="1.5"
										d="m18.5 2 .258.697c.338.914.507 1.371.84 1.704.334.334.791.503 1.705.841L22 5.5l-.697.258c-.914.338-1.371.507-1.704.84-.334.334-.503.791-.841 1.705L18.5 9l-.258-.697c-.338-.914-.507-1.371-.84-1.704-.334-.334-.791-.503-1.705-.841L15 5.5l.697-.258c.914-.338 1.371-.507 1.704-.84.334-.334.503-.791.841-1.705L18.5 2Z"
										opacity=".4"
									/>
									<path
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.5"
										d="m15.5 12 1.227 1.057c.515.445.773.667.773.943 0 .276-.258.498-.773.943L15.5 16m-8-4-1.227 1.057c-.515.445-.773.667-.773.943 0 .276.258.498.773.943L7.5 16m5-5-2 6"
									/>
								</svg>
							}
							title="The Machine That Builds The Machine"
							description="We don't just build software; we build the system that builds the software. Every bug you fix, every preference you tweak, becomes part of your system's memory."
							delay={0.2}
						/>
					</div>
				</div>

				<div className="container border-x py-16">
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.3 }}
						className="text-balance rounded-none text-center text-lg leading-relaxed"
					>
						This turns your development process into an{' '}
						<strong>investment</strong>. Every day you work, your
						&quot;interest&quot; compounds, leaving you with a toolkit that is
						exponentially more powerful than when you started.
					</motion.p>
				</div>
			</AnimatedSection>
			<div className="px-0! border-b">
				<div className="px-0! container border-x">
					<TickerScroll className="h-24 w-full" />
				</div>
			</div>
			{/* Why dev.build Section */}
			<AnimatedSection className="bg-muted/30 relative">
				<div className="container border-x py-24 sm:py-32">
					<SectionHeader
						title="Why dev.build?"
						description="The tools will change. The principles won't. We don't teach you just how to use a specific version of Cursor or a specific model from OpenAI. We teach you the underlying patterns of AI-assisted engineering that apply to every tool in the ecosystem. Dev.build focuses on
							the enduring skills of the new era."
					/>
				</div>
			</AnimatedSection>
			<div className="bg-muted/30">
				<div className="px-0! container grid grid-cols-1 gap-px divide-y border-x md:divide-x md:divide-y-0 lg:grid-cols-3">
					<GridCard
						className="bg-muted/30"
						icon={
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="size-10"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke="currentColor"
									strokeLinejoin="round"
									strokeWidth="1.5"
									d="m10.938 11.077-7.527 7.528a1.403 1.403 0 1 0 1.985 1.984l7.527-7.527m-1.985-1.985 1.985 1.985m-1.985-1.985.744-.744m1.24 2.729.745-.744m-1.985-1.985.043-.042a.992.992 0 0 1 1.403 0l.581.58a.992.992 0 0 1 0 1.404l-.042.043m-1.985-1.985 1.985 1.985m4.571-9.151a.29.29 0 0 1 .524 0l.392.84c.173.37.47.666.84.839l.839.392a.29.29 0 0 1 0 .524l-.84.392c-.37.173-.666.47-.839.84l-.392.839a.29.29 0 0 1-.524 0l-.392-.84a1.737 1.737 0 0 0-.84-.839l-.839-.392a.29.29 0 0 1 0-.524l.84-.392c.37-.173.666-.47.839-.84l.392-.839Z"
								/>
								<path
									stroke="currentColor"
									strokeLinejoin="round"
									strokeWidth="1.5"
									d="M18.238 14.167a.29.29 0 0 1 .524 0l.392.84c.173.37.47.666.84.839l.839.392a.29.29 0 0 1 0 .524l-.84.392c-.37.173-.666.47-.839.84l-.392.839a.29.29 0 0 1-.524 0l-.392-.84a1.737 1.737 0 0 0-.84-.839l-.839-.392a.29.29 0 0 1 0-.524l.84-.392c.37-.173.666-.47.839-.84l.392-.839Zm-11-11a.29.29 0 0 1 .524 0l.392.84c.173.37.47.666.84.839l.839.392a.29.29 0 0 1 0 .524l-.84.392c-.37.173-.666.47-.839.84l-.392.839a.29.29 0 0 1-.524 0l-.392-.84a1.737 1.737 0 0 0-.84-.839l-.839-.392a.29.29 0 0 1 0-.524l.84-.392c.37-.173.666-.47.839-.84l.392-.839Z"
									opacity=".4"
								/>
							</svg>
						}
						title="Tool Fluency"
						description="Knowing exactly when to reach for a CLI agent versus an IDE assistant."
						delay={0}
					/>
					<GridCard
						className="bg-muted/30"
						icon={
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="size-10"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke="currentColor"
									strokeWidth="1.5"
									d="M2 6c0-.943 0-1.414.293-1.707C2.586 4 3.057 4 4 4c.943 0 1.414 0 1.707.293C6 4.586 6 5.057 6 6v2c0 .943 0 1.414-.293 1.707C5.414 10 4.943 10 4 10c-.943 0-1.414 0-1.707-.293C2 9.414 2 8.943 2 8V6Z"
								/>
								<path
									stroke="currentColor"
									strokeWidth="1.5"
									d="M6.5 16c0-.943 0-1.414.293-1.707C7.086 14 7.557 14 8.5 14c.943 0 1.414 0 1.707.293.293.293.293.764.293 1.707v2c0 .943 0 1.414-.293 1.707C9.914 20 9.443 20 8.5 20c-.943 0-1.414 0-1.707-.293C6.5 19.414 6.5 18.943 6.5 18v-2Z"
									opacity=".4"
								/>
								<path
									stroke="currentColor"
									strokeWidth="1.5"
									d="M13.5 6c0-.943 0-1.414.293-1.707C14.086 4 14.557 4 15.5 4c.943 0 1.414 0 1.707.293.293.293.293.764.293 1.707v2c0 .943 0 1.414-.293 1.707-.293.293-.764.293-1.707.293-.943 0-1.414 0-1.707-.293C13.5 9.414 13.5 8.943 13.5 8V6Zm0 10c0-.943 0-1.414.293-1.707C14.086 14 14.557 14 15.5 14c.943 0 1.414 0 1.707.293.293.293.293.764.293 1.707v2c0 .943 0 1.414-.293 1.707-.293.293-.764.293-1.707.293-.943 0-1.414 0-1.707-.293-.293-.293-.293-.764-.293-1.707v-2Z"
								/>
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="1.5"
									d="m9 5 1.5-1v6"
									opacity=".4"
								/>
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="1.5"
									d="m2 15 1.5-1v6"
								/>
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="1.5"
									d="M20.5 5 22 4v6m-1.5 5 1.5-1v6"
									opacity=".4"
								/>
							</svg>
						}
						title="System Design"
						description="Building scriptable environments that adapt to new tools as they emerge."
						delay={0.1}
					/>
					<GridCard
						className="bg-muted/30"
						icon={
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="size-10"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke="currentColor"
									strokeWidth="1.5"
									d="M3 19c0 1.414 0 2.121.44 2.56C3.878 22 4.585 22 6 22c1.414 0 2.121 0 2.56-.44C9 21.122 9 20.415 9 19c0-1.414 0-2.121-.44-2.56C8.122 16 7.415 16 6 16c-1.414 0-2.121 0-2.56.44C3 16.878 3 17.585 3 19ZM3 5c0 1.414 0 2.121.44 2.56C3.878 8 4.585 8 6 8c1.414 0 2.121 0 2.56-.44C9 7.122 9 6.415 9 5c0-1.414 0-2.121-.44-2.56C8.122 2 7.415 2 6 2c-1.414 0-2.121 0-2.56.44C3 2.878 3 3.585 3 5Zm12 9c0 1.414 0 2.121.44 2.56.439.44 1.146.44 2.56.44 1.414 0 2.121 0 2.56-.44.44-.439.44-1.146.44-2.56 0-1.414 0-2.121-.44-2.56C20.122 11 19.415 11 18 11c-1.414 0-2.121 0-2.56.44C15 11.878 15 12.585 15 14Z"
								/>
								<path
									fill="currentColor"
									d="M6.75 8a.75.75 0 0 0-1.5 0h1.5Zm-1.5 8a.75.75 0 0 0 1.5 0h-1.5ZM15 14.75a.75.75 0 0 0 0-1.5v1.5ZM5.25 8v8h1.5V8h-1.5ZM12 14.75h3v-1.5h-3v1.5ZM5.25 8A6.75 6.75 0 0 0 12 14.75v-1.5A5.25 5.25 0 0 1 6.75 8h-1.5Z"
									opacity=".4"
								/>
							</svg>
						}
						title="Workflow Architecture"
						description="Connecting isolated tools into a cohesive, automated pipeline."
						delay={0.2}
					/>
				</div>
				{/* <ul className="space-y-6">
							<BulletItem
								index={0}
								title="Tool Fluency"
								description="Knowing exactly when to reach for a CLI agent versus an IDE assistant."
							/>
							<BulletItem
								index={1}
								title="System Design"
								description="Building scriptable environments that adapt to new tools as they emerge."
							/>
							<BulletItem
								index={2}
								title="Workflow Architecture"
								description="Connecting isolated tools into a cohesive, automated pipeline."
							/>
						</ul> */}
			</div>
			{/* What You'll Get Section */}
			<AnimatedSection className="relative" data-theme="invert">
				<div className="container border-x py-24 sm:py-32">
					<SectionHeader title="What You'll Get" />
				</div>
				{/* Tight grid */}
				<div className="border-t">
					<div className="bg-border px-0! container grid grid-cols-1 gap-px border-x sm:grid-cols-2 lg:grid-cols-3">
						{[
							{
								title: 'Use-Case Driven Strategy',
								description:
									'Learn the "sweet spot" for every tool—when to use Gemini\'s massive context, when to use Claude\'s reasoning, and when to use a simple script.',
							},
							{
								title: 'Universal Techniques',
								description:
									'Master the core concepts—Rules, Hooks, Skills, and Plans—that work across Claude Code, Cursor, and custom agents.',
							},
							{
								title: 'Adaptable Workflows',
								description:
									'Build a personal toolkit that grows with you. The prompts, scripts, and configurations you create here are designed to be portable and resilient to change.',
							},
							{
								title: 'Orchestration Patterns',
								description:
									'Discover how to make disparate tools talk to each other, turning your local environment into a unified creative engine.',
							},
							{
								title: 'Future-Proof Foundations',
								description:
									'Focus on text-based configuration and open standards (like MCP) that ensure your workflow survives the next hype cycle.',
							},
							{
								title: 'Community-Driven Learning',
								description:
									'Access a growing library of shared skills, prompts, and configurations from practitioners pushing the same boundaries.',
							},
						].map((item, index) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
								whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
								viewport={{ once: true }}
								transition={{
									duration: 0.5,
									delay: index * 0.08,
									ease: [0.21, 0.47, 0.32, 0.98],
								}}
								className="bg-background flex min-h-[220px] flex-col p-8 transition-colors"
							>
								<div className="text-muted-foreground mb-4 font-mono text-sm font-medium">
									{String(index + 1).padStart(2, '0')}
								</div>
								<h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
								<p className="text-muted-foreground text-base leading-relaxed">
									{item.description}
								</p>
							</motion.div>
						))}
					</div>
				</div>
			</AnimatedSection>

			{/* Content Roadmap Section */}
			<AnimatedSection className="relative">
				<div className="container border-x py-24 sm:py-32">
					<SectionHeader
						title="Content Roadmap"
						description="The tools change weekly, but the principles of creative orchestration are timeless. This living curriculum evolves with the industry."
					/>
				</div>
				<div className="border-border border-t">
					<div className="divide-border container divide-y border-x px-0">
						<ExpandableSection title="Part 0 – AI Environment Essentials">
							<ul className="list-inside list-disc space-y-4 px-5">
								<li>
									<strong>The CLI Backbone</strong> – Setting up GitHub CLI (gh)
									for agent-driven collaboration.
								</li>
								<li>
									<strong>Safety Nets</strong> – Mastering Local History and
									undo trees to fearlessly experiment.
								</li>
								<li>
									<strong>Visual Communication</strong> – Screenshot and
									annotation workflows for precise multi-modal context.
								</li>
								<li>
									<strong>Terminal Multiplexing</strong> – Using tmux to keep
									multiple creative streams alive.
								</li>
								<li>
									<strong>Clean Slate Protocols</strong> – Isolating
									environments to keep your creative space pristine.
								</li>
							</ul>
						</ExpandableSection>

						<ExpandableSection title="Part 1 – The AI Mindset & Tooling Landscape">
							<ul className="list-inside list-disc space-y-4 px-5">
								<li>
									<strong>Rethinking Development</strong> – Moving from
									&quot;writing code&quot; to &quot;shaping software.&quot;
								</li>
								<li>
									<strong>The Tooling Spectrum</strong> – CLI vs. IDE vs. Web.
									Choosing your canvas.
								</li>
								<li>
									<strong>The Big Four Setup</strong> – Deep configuration for
									Cursor, Claude Code, Gemini, and Codex CLI.
								</li>
								<li>
									<strong>Context is King</strong> – Understanding how to feed
									your agents the right inspiration.
								</li>
								<li>
									<strong>Prompt Engineering for Engineers</strong> – Beyond
									&quot;fix this&quot; -&gt; Co-creation patterns.
								</li>
							</ul>
						</ExpandableSection>

						<ExpandableSection title="Part 2 – CLI Agents & Scriptable Workflows">
							<ul className="list-inside list-disc space-y-4 px-5">
								<li>
									<strong>Deep Dive: Claude Code</strong> – Building custom
									Skills that extend your capabilities.
								</li>
								<li>
									<strong>OpenAI & Gemini CLIs</strong> – Leveraging massive
									context windows for deep exploration.
								</li>
								<li>
									<strong>Local Scripting</strong> – Wiring agents into zsh/bash
									functions for instant creative bursts.
								</li>
								<li>
									<strong>The &quot;Unix Philosophy&quot; of AI</strong> –
									Chaining small, focused AI tools together to build complex
									systems.
								</li>
								<li>
									<strong>Git Integration</strong> – Intelligent commit
									generation and history analysis to track your evolution.
								</li>
							</ul>
						</ExpandableSection>

						<ExpandableSection title="Part 3 – The Intelligent IDE">
							<ul className="list-inside list-disc space-y-4 px-5">
								<li>
									<strong>Cursor & VS Code</strong> – Composer, &quot;Tab&quot;
									workflows, and local model management.
								</li>
								<li>
									<strong>Google&apos;s Anti-Gravity IDE</strong> – Exploring
									the new frontier of cloud-native AI editing.
								</li>
								<li>
									<strong>Flow State</strong> – Configuring your environment to
									reduce friction and latency.
								</li>
								<li>
									<strong>Shortcuts & Macros</strong> – Binding AI actions to
									muscle memory.
								</li>
								<li>
									<strong>Debugging with Agents</strong> – Turning error
									messages into learning opportunities.
								</li>
							</ul>
						</ExpandableSection>

						<ExpandableSection title="Part 4 – Design, Multi-modality & Frontend">
							<ul className="list-inside list-disc space-y-4 px-5">
								<li>
									<strong>Visual Intelligence</strong> – Using images and
									screenshots to drive development.
								</li>
								<li>
									<strong>Chrome DevTools MCP</strong> – Connecting agents
									directly to the browser for pixel-perfect design.
								</li>
								<li>
									<strong>Frontend Workflows</strong> – From v0.dev prototyping
									to production components.
								</li>
								<li>
									<strong>Design Systems</strong> – Teaching agents to adhere to
									and evolve your visual language.
								</li>
							</ul>
						</ExpandableSection>

						<ExpandableSection title="Part 5 – Orchestration, Customization & Team Workflows">
							<ul className="list-inside list-disc space-y-4 px-5">
								<li>
									<strong>Personalized Power Tools</strong> – Using AI to write
									the scripts that configure your environment.
								</li>
								<li>
									<strong>Background Workers</strong> – Running
									&quot;heavy&quot; refactors or test generation in the
									background.
								</li>
								<li>
									<strong>Shared Context</strong> – Building team-wide memories
									and documentation vectors.
								</li>
								<li>
									<strong>Scalable Patterns</strong> – How to roll out AI tools
									to a team of 10, 50, or 100.
								</li>
								<li>
									<strong>Custom MCP Servers</strong> – Extending agent
									capabilities with Model Context Protocol.
								</li>
							</ul>
						</ExpandableSection>
					</div>
				</div>
			</AnimatedSection>
			{/* Learning Outcomes */}
			<AnimatedSection className="relative" data-theme="purple">
				<section className="border-b">
					<div className="px-0! container border-x">
						<TickerScroll className="h-16 w-full" reverse />
					</div>
				</section>
				<div className="container border-x py-24 sm:py-32">
					<SectionHeader title="Learning Outcomes" />
				</div>
				<div className="border-t">
					<div className="bg-border container grid grid-cols-1 gap-px border-x px-0 sm:grid-cols-2 lg:grid-cols-5">
						{[
							'Develop a "tools-first" intuition for solving any coding problem.',
							'Command the command line as a primary interface for creative exploration.',
							'Build and share custom skills/tools that automate your unique workflow.',
							'Architect systems where humans provide the vision and agents handle the implementation.',
							'Leverage multi-modal inputs (images, browser context) for full-stack expression.',
						].map((outcome, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
								whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
								viewport={{ once: true }}
								transition={{
									duration: 0.5,
									delay: index * 0.08,
									ease: [0.21, 0.47, 0.32, 0.98],
								}}
								className="bg-background flex flex-col p-6 sm:min-h-[180px]"
							>
								<div className="text-muted-foreground mb-4 font-mono text-sm font-medium">
									{String(index + 1).padStart(2, '0')}
								</div>
								<p className="text-foreground text-base font-medium leading-relaxed">
									{outcome}
								</p>
							</motion.div>
						))}
					</div>
				</div>
				<div className="border-t">
					<div className="px-0! container border-x">
						<TickerScroll className="h-24 w-full" />
					</div>
				</div>
			</AnimatedSection>

			{/* Instructor */}
			<AnimatedSection className="relative" data-theme="purple">
				<div className="container border-x px-0">
					<InstructorSection />
				</div>
			</AnimatedSection>

			{/* Community */}
			<AnimatedSection className="relative">
				<div className="container border-x py-24 sm:py-32">
					<SectionHeader
						title="Community & Ecosystem"
						description="Joining dev.build means plugging into a network of forward-thinking engineers."
					/>
				</div>
				{/* Tight grid */}
				<div className="border-t">
					<div className="bg-border container grid grid-cols-1 gap-px border-x px-0 sm:grid-cols-2">
						{[
							{
								title: 'Weekly Deep Dives',
								description:
									'Exploring the latest releases (e.g., new Claude capabilities, Gemini updates).',
							},
							{
								title: 'Shared "Skills" Library',
								description:
									'A repository of community-vetted prompts and agent configs.',
							},
							{
								title: 'Workflow Recipes',
								description:
									'Copy-paste configurations for common development tasks.',
							},
							{
								title: 'Direct Access',
								description:
									'To evolving best practices as we discover them together.',
							},
						].map((item, index) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
								whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
								viewport={{ once: true }}
								transition={{
									duration: 0.4,
									delay: index * 0.1,
									ease: [0.21, 0.47, 0.32, 0.98],
								}}
								className="bg-background flex min-h-[140px] items-start gap-4 p-8 transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="mt-0.5 size-6 shrink-0"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										strokeWidth="1.5"
										d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109C18.717 21.5 16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391C2.5 18.717 2.5 16.479 2.5 12Z"
									/>
									<path
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.5"
										d="M10 7s4 3.682 4 5-4 5-4 5"
										opacity=".4"
									/>
								</svg>

								<div>
									<h3 className="text-lg font-semibold">{item.title}</h3>
									<p className="text-muted-foreground mt-2 leading-relaxed">
										{item.description}
									</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</AnimatedSection>

			{/* CTA Section */}
			<AnimatedSection className="relative overflow-hidden" data-theme="yellow">
				<div className="container border-x pb-10 pt-16 sm:pb-10 sm:pt-24">
					<div className="relative">
						<div className="mb-12 text-center">
							<h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
								Join the Evolution
							</h2>
							<p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-xl">
								The industry is moving fast. Don&apos;t get stuck in the last
								generation of workflows.
							</p>
						</div>
					</div>
				</div>
				<div className="border-t">
					<div className="items container border-x px-0">
						<PrimaryNewsletterCta actionLabel="Join Now" className="">
							<div />
						</PrimaryNewsletterCta>
					</div>
				</div>
				<div className="hidden md:block" data-theme="yellow">
					<div className="px-0! container border-x">
						<TickerScroll className="h-8 w-full md:h-24" />
					</div>
				</div>
			</AnimatedSection>

			{/* Contact */}
			<AnimatedSection className="relative">
				<div className="container border-x py-16">
					<div className="text-center">
						<h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
							Questions?
						</h2>
						<p className="text-muted-foreground mt-4 text-lg">
							Have a specific workflow challenge or team training need?{' '}
							<Link href="/contact" className="text-primary hover:underline">
								Contact me
							</Link>{' '}
							to discuss how we can help.
						</p>
						<p className="text-muted-foreground mt-8 text-xl font-medium">
							Let&apos;s build something amazing.
						</p>
					</div>
				</div>
			</AnimatedSection>
		</div>
	)
}

export default LandingContent
