'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

import { cn } from '@coursebuilder/ui/utils/cn'

interface FeatureSectionProps extends React.HTMLAttributes<HTMLElement> {
	children: React.ReactNode
}

export function FeatureSection({
	className,
	children,
	...props
}: FeatureSectionProps) {
	return (
		<section className={cn('bg-muted/30 py-24 sm:py-32', className)} {...props}>
			<div className="container mx-auto px-4">{children}</div>
		</section>
	)
}

interface FeatureHeaderProps {
	label?: string
	title?: string
	description?: string
	children?: React.ReactNode
	className?: string
}

export function FeatureHeader({
	label,
	title,
	description,
	children,
	className,
}: FeatureHeaderProps) {
	return (
		<div className={cn('mx-auto mb-16 max-w-3xl md:text-center', className)}>
			{label && (
				<h2 className="text-primary font-mono text-sm font-semibold uppercase tracking-wider">
					{label}
				</h2>
			)}
			{title && (
				<h3 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
					{title}
				</h3>
			)}
			{description && (
				<p className="text-muted-foreground mt-6 text-lg">{description}</p>
			)}
			{children}
		</div>
	)
}

interface FeatureGridProps {
	className?: string
	children: React.ReactNode
}

export function FeatureGrid({ className, children }: FeatureGridProps) {
	return (
		<div
			className={cn('mx-auto grid max-w-6xl gap-8 md:grid-cols-3', className)}
		>
			{children}
		</div>
	)
}

interface FeatureCardProps {
	icon?: LucideIcon | React.ElementType
	title: string
	description: string
	className?: string
	children?: React.ReactNode
	delay?: number
}

export function FeatureCard({
	icon: Icon,
	title,
	description,
	className,
	children,
	delay = 0,
}: FeatureCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ delay }}
			className={cn(
				'bg-card hover:border-primary/50 group relative overflow-hidden rounded-2xl border p-8 transition-colors',
				className,
			)}
		>
			{Icon && (
				<div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors">
					<Icon className="h-6 w-6" />
				</div>
			)}
			<h4 className="mb-2 text-xl font-semibold">{title}</h4>
			<p className="text-muted-foreground">{description}</p>
			{children}
		</motion.div>
	)
}
