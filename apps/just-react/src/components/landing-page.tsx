'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Brain, Check, Layers, Terminal } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import {
	FeatureCard,
	FeatureGrid,
	FeatureHeader,
	FeatureSection,
	SplitContent,
	SplitSection,
	SplitVisual,
} from './landing/feature-section'

const fadeIn = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 },
}

const staggerContainer = {
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
}

export function LandingPage() {
	const { scrollYProgress } = useScroll()
	const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
	const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

	return (
		<div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex min-h-screen flex-col overflow-hidden">
			{/* Hero Section */}
			<section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
				<div className="from-primary/20 via-background to-background absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] opacity-50" />
				<motion.div
					style={{ opacity, scale }}
					className="mx-auto max-w-5xl space-y-8"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.7, ease: 'easeOut' }}
					>
						<h1 className="from-foreground to-foreground/50 bg-gradient-to-b bg-clip-text text-5xl font-bold tracking-tighter text-transparent sm:text-7xl md:text-8xl lg:text-9xl">
							The Vision
						</h1>
						<h2 className="text-muted-foreground mt-4 text-2xl font-light tracking-tight sm:text-4xl md:text-5xl">
							Limitless Creation
						</h2>
					</motion.div>

					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5, duration: 0.5 }}
						className="text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl"
					>
						Software development has always been a trade-off between imagination
						and implementation.
						<br className="hidden sm:inline" />
						AI changes the physics of creation.
					</motion.p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 1, duration: 0.5 }}
					className="absolute bottom-10 left-0 right-0 flex justify-center"
				>
					<div className="text-muted-foreground animate-bounce">
						<ArrowRight className="h-6 w-6 rotate-90" />
					</div>
				</motion.div>
			</section>

			{/* Philosophy Section */}
			<section className="container mx-auto px-4 py-24 sm:py-32">
				<motion.div
					initial="initial"
					whileInView="animate"
					viewport={{ once: true }}
					variants={staggerContainer}
					className="mx-auto max-w-4xl space-y-12"
				>
					<motion.div variants={fadeIn} className="text-center">
						<p className="text-2xl font-medium leading-relaxed sm:text-3xl md:text-4xl">
							We don't view AI as a manager delegating tasks.
							<span className="text-primary">
								{' '}
								We view it as a creative multiplier
							</span>
							—a partner that allows you to explore ideas faster than you can
							type them.
						</p>
					</motion.div>
				</motion.div>
			</section>

			{/* Pushing the Boundaries */}
			<FeatureSection>
				<FeatureHeader
					label="01. Exploration"
					title="Pushing the Boundaries"
					description='The "expert" used to be the person who knew the limitations. The modern creator is the person who finds the possibilities.'
				/>
				<FeatureGrid>
					<FeatureCard
						icon={<Brain />}
						title="Curiosity as the Engine"
						description='Use AI to explore every "what if" without friction.'
						delay={0}
					/>
					<FeatureCard
						icon={<Terminal />}
						title="The Right Tool for the Job"
						description="Seamlessly switch between visual design tools, CLI agents, and deep-thinking architects."
						delay={0.1}
					/>
					<FeatureCard
						icon={<Layers />}
						title="Multi-Modal Expression"
						description="Use sketches, screenshots, and voice to communicate your intent."
						delay={0.2}
					/>
				</FeatureGrid>
			</FeatureSection>

			{/* AI as the Bridge */}
			<SplitSection>
				<SplitContent label="02. Integration" title="AI as the Bridge">
					<p>
						The most powerful systems start as simple scripts. AI helps you
						bridge the gap between a "hacky script" and a "robust tool."
					</p>
					<p>
						We teach you to build workflows that are adaptable and flexible,
						allowing you to iterate wildly on your own machine, then solidify
						those workflows into reliable tools that your whole team can use.
					</p>
				</SplitContent>
				<SplitVisual />
			</SplitSection>

			{/* The Self-Improving Workspace */}
			<section className="bg-foreground text-background py-24 sm:py-32">
				<div className="container mx-auto px-4">
					<div className="mb-16 max-w-3xl">
						<h2 className="text-primary-dark font-mono text-sm font-semibold uppercase tracking-wider">
							03. Compound Growth
						</h2>
						<h3 className="text-background mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
							The Self-Improving Workspace
						</h3>
						<p className="text-background/80 mt-6 text-lg">
							In a traditional workflow, you solve the same problem ten times.
							In a Compound Growth workflow, you solve it once, and your
							environment remembers it forever.
						</p>
					</div>

					<div className="grid gap-12 md:grid-cols-3">
						{[
							{
								title: 'Harvesting Intelligence',
								content:
									'Learn to mine your agent conversations for reusable "Skills" and "Rules." Every successfully solved ticket becomes a template for the next one.',
							},
							{
								title: 'The Feedback Loop',
								content:
									'We treat logs, errors, and debug sessions as high-value signals. By feeding this data back into your system, you create a self-correcting loop where your tools get more reliable the more you use them.',
							},
							{
								title: 'The Machine That Builds The Machine',
								content:
									"We don't just build software; we build the system that builds the software. Every bug you fix, every preference you tweak, becomes part of your system's memory.",
							},
						].map((item, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.1 }}
								className="border-primary-dark space-y-4 border-l-2 pl-6"
							>
								<h4 className="text-background text-xl font-bold">
									{item.title}
								</h4>
								<p className="text-background/70">{item.content}</p>
							</motion.div>
						))}
					</div>

					<motion.div
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						className="mt-16 rounded-2xl bg-white/5 p-8 text-center"
					>
						<p className="text-primary-dark text-xl font-medium italic">
							"This turns your development process into an investment. Every day
							you work, your 'interest' compounds..."
						</p>
					</motion.div>
				</div>
			</section>

			{/* Why dev.build & What You'll Get */}
			<section className="container mx-auto px-4 py-24 sm:py-32">
				<div className="grid gap-16 lg:grid-cols-2">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
					>
						<h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
							Why dev.build?
						</h3>
						<p className="text-muted-foreground mt-6 text-lg">
							The tools will change. The principles won't. We don't teach you
							just how to use a specific version of Cursor or a specific model
							from OpenAI. We teach you the underlying patterns of AI-assisted
							engineering that apply to every tool in the ecosystem.
						</p>

						<ul className="mt-8 space-y-4">
							{[
								{
									title: 'Tool Fluency',
									desc: 'Knowing exactly when to reach for a CLI agent versus an IDE assistant.',
								},
								{
									title: 'System Design',
									desc: 'Building scriptable environments that adapt to new tools as they emerge.',
								},
								{
									title: 'Workflow Architecture',
									desc: 'Connecting isolated tools into a cohesive, automated pipeline.',
								},
							].map((item, i) => (
								<li key={i} className="flex items-start gap-3">
									<div className="bg-primary text-primary-foreground mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
										<Check className="h-3 w-3" />
									</div>
									<div>
										<strong className="font-medium">{item.title}:</strong>{' '}
										<span className="text-muted-foreground">{item.desc}</span>
									</div>
								</li>
							))}
						</ul>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						className="bg-card rounded-3xl border p-8 shadow-sm"
					>
						<h3 className="text-2xl font-bold">What You’ll Get</h3>
						<div className="mt-6 grid gap-6">
							{[
								'Use-Case Driven Strategy',
								'Universal Techniques (Rules, Hooks, Skills)',
								'Adaptable Workflows',
								'Orchestration Patterns',
								'Future-Proof Foundations',
							].map((item, i) => (
								<div
									key={i}
									className="flex items-center gap-3 border-b pb-4 last:border-0"
								>
									<div className="bg-muted text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
										{i + 1}
									</div>
									<span className="font-medium">{item}</span>
								</div>
							))}
						</div>
						<div className="mt-8">
							<Button size="lg" className="w-full" asChild>
								<Link href="/start">Start Building Your System</Link>
							</Button>
						</div>
					</motion.div>
				</div>
			</section>
		</div>
	)
}
