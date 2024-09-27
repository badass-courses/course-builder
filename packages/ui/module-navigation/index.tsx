'use client'

import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { z } from 'zod'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../index'
import { cn } from '../utils/cn'

export const NavigationLessonSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	type: z.literal('lesson'),
})

export const NavigationSectionSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	type: z.literal('section'),
	lessons: z.array(NavigationLessonSchema),
})

export const NavigationResourceSchema = z.discriminatedUnion('type', [
	NavigationSectionSchema,
	NavigationLessonSchema,
])

type NavigationResource = z.infer<typeof NavigationResourceSchema>

type ModuleNavigationContextType = {
	moduleSlug: string
	moduleType: string
	currentResourceSlug?: string
	currentGroupId?: string | null
}

type RootProps = ModuleNavigationContextType & {
	className?: string
	asChild?: boolean
}

const ModuleNavigationContext = React.createContext<
	ModuleNavigationContextType | undefined
>(undefined)

export const ModuleNavigationProvider: React.FC<
	ModuleNavigationContextType & { children: React.ReactNode }
> = ({ children, ...props }) => {
	return (
		<ModuleNavigationContext.Provider value={props}>
			{children}
		</ModuleNavigationContext.Provider>
	)
}

export const useModuleNavigation = () => {
	const context = React.useContext(ModuleNavigationContext)
	if (context === undefined) {
		throw new Error(
			'useModuleNavigation must be used within an ModuleNavigationProvider',
		)
	}
	return context
}

const Root: React.FC<React.PropsWithChildren<RootProps>> = ({
	children,
	className,
	asChild,
	...props
}) => {
	const Comp = asChild ? Slot : 'ol'

	return (
		<ModuleNavigationProvider {...props}>
			<Comp className={cn('', className)}>{children}</Comp>
		</ModuleNavigationProvider>
	)
}

const Resource: React.FC<{
	resource: NavigationResource
	children?: React.ReactNode
	asChild?: boolean
	href?: string
	className?: string
}> = ({ resource, children, asChild, href, className }) => {
	const Comp = asChild ? Slot : href ? 'a' : 'div'
	const { currentResourceSlug } = useModuleNavigation()
	return (
		<li>
			<Comp
				data-active
				className={cn('flex items-center', className)}
				href={href}
				aria-current={
					currentResourceSlug === resource.slug ? 'page' : undefined
				}
			>
				{children}
			</Comp>
		</li>
	)
}

const ResourceIndicator: React.FC<{
	className?: string
	children?: React.ReactNode
}> = ({ children, className }) => {
	return <div className={cn('', className)}>{children}</div>
}

const ResourceGroup: React.FC<{
	resource: NavigationResource
	children: React.ReactNode
	className?: string
}> = ({ resource, children, className }) => {
	const { currentGroupId } = useModuleNavigation()

	return (
		<Accordion
			asChild
			type="single"
			collapsible
			defaultValue={currentGroupId || ''}
		>
			<li>
				<AccordionItem
					value={resource.id}
					className={cn('border-b-0', className)}
				>
					{children}
				</AccordionItem>
			</li>
		</Accordion>
	)
}

const ResourceGroupTrigger: React.FC<{
	children: React.ReactNode
	className?: string
}> = ({ children, className }) => {
	return (
		<AccordionTrigger
			className={cn('flex w-full items-center justify-between', className)}
		>
			{children}
		</AccordionTrigger>
	)
}
const ResourceGroupContent: React.FC<{
	children: React.ReactNode
	className?: string
}> = ({ children, className }) => {
	return (
		<AccordionContent asChild className={cn('', className)}>
			<ol>{children}</ol>
		</AccordionContent>
	)
}

export {
	Root,
	Resource,
	ResourceGroup,
	ResourceIndicator,
	ResourceGroupTrigger,
	ResourceGroupContent,
	type RootProps,
}
