'use client'

import * as React from 'react'
import Image from 'next/image'
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
		<section className={cn('py-24 sm:py-32', className)} {...props}>
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
	icon?: React.ReactNode
	title: string
	description: string
	className?: string
	children?: React.ReactNode
	delay?: number
}

export function FeatureCard({
	icon,
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
				'not-prose bg-card group relative overflow-hidden rounded-2xl border p-8 transition-colors',
				className,
			)}
		>
			{icon && (
				<div className="bg-primary/10 text-primary group-hover:text-primary-foreground mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors">
					{icon}
				</div>
			)}
			<h4 className="mb-2 text-xl font-semibold">{title}</h4>
			<p className="text-muted-foreground">{description}</p>
			{children}
		</motion.div>
	)
}

interface SplitSectionProps extends React.HTMLAttributes<HTMLElement> {
	children: React.ReactNode
}

export function SplitSection({
	className,
	children,
	...props
}: SplitSectionProps) {
	return (
		<section
			className={cn('container mx-auto px-4 py-24 sm:py-32', className)}
			{...props}
		>
			<div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
				{children}
			</div>
		</section>
	)
}

interface SplitContentProps {
	label?: string
	title?: string
	children?: React.ReactNode
	className?: string
	delay?: number
}

export function SplitContent({
	label,
	title,
	children,
	className,
	delay = 0,
}: SplitContentProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -50 }}
			whileInView={{ opacity: 1, x: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.6, delay }}
			className={className}
		>
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
			{children && (
				<div className="text-muted-foreground mt-6 space-y-6 text-lg">
					{children}
				</div>
			)}
		</motion.div>
	)
}

interface SplitVisualProps {
	children?: React.ReactNode
	className?: string
	delay?: number
}

export function SplitVisual({
	children,
	className,
	delay = 0,
}: SplitVisualProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 50 }}
			whileInView={{ opacity: 1, x: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.6, delay }}
			className={cn(
				'bg-primary/10 not-prose relative aspect-square overflow-hidden rounded-2xl md:aspect-video lg:aspect-square',
				className,
			)}
		>
			{children || (
				<div className="bg-primary/20 absolute inset-0 flex items-center justify-center">
					<div className="text-muted-foreground text-sm">
						Visual Placeholder
					</div>
				</div>
			)}
		</motion.div>
	)
}
