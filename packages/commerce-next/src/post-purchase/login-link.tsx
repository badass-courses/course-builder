'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@coursebuilder/ui/utils/cn'

type LoginLinkContextType = {
	email: string
}

type RootProps = LoginLinkContextType & {
	className?: string
}

const LoginLinkContext = React.createContext<LoginLinkContextType | undefined>(
	undefined,
)

export const LoginLinkProvider: React.FC<
	LoginLinkContextType & { children: React.ReactNode }
> = ({ children, ...props }) => {
	return (
		<LoginLinkContext.Provider value={props}>
			{children}
		</LoginLinkContext.Provider>
	)
}

export const useLoginLink = () => {
	const context = React.use(LoginLinkContext)
	if (context === undefined) {
		throw new Error('useLoginLink must be used within an LoginLinkProvider')
	}
	return context
}

const Root: React.FC<React.PropsWithChildren<RootProps>> = ({
	children,
	className,
	...props
}) => (
	<LoginLinkProvider {...props}>
		<section className={cn('w-full', className)}>{children}</section>
	</LoginLinkProvider>
)

// title

type TitleProps = {
	asChild?: boolean
	className?: string
}

const Title: React.FC<React.PropsWithChildren<TitleProps>> = ({
	className,
	asChild,
	children = (
		<>
			Please check your inbox for a <strong>login link</strong> that just got
			sent.
		</>
	),
}) => {
	const Comp = asChild ? Slot : 'h2'

	return (
		<Comp
			className={cn(
				'w-full text-balance text-lg font-medium sm:text-xl lg:text-2xl',
				className,
			)}
		>
			{children}
		</Comp>
	)
}

// CTA

type CTAProps = {
	asChild?: boolean
	className?: string
}

const CTA: React.FC<React.PropsWithChildren<CTAProps>> = ({
	className,
	asChild,
	children,
}) => {
	const { email } = useLoginLink()
	const Comp = asChild ? Slot : 'div'

	return (
		<Comp className={cn('w-full text-balance', className)}>
			{children || (
				<>
					<strong>Login link sent to: {email}</strong>
				</>
			)}
		</Comp>
	)
}

// status

type StatusProps = {
	className?: string
}

const Status: React.FC<React.PropsWithChildren<StatusProps>> = ({
	className,
	children = 'Final step',
}) => {
	return (
		<span
			className={cn(
				'text-primary block pb-4 text-sm font-semibold uppercase',
				className,
			)}
		>
			{children}
		</span>
	)
}

// description

type DescriptionProps = {
	className?: string
}

const Description: React.FC<React.PropsWithChildren<DescriptionProps>> = ({
	className,
	children,
}) => {
	const { email } = useLoginLink()
	return (
		<p className={cn('w-full text-balance pt-5', className)}>
			{children || (
				<>
					As a final step to access the course you need to check your inbox (
					<strong>{email}</strong>) where you will find an email from{' '}
					<strong>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</strong> with a link
					to access your purchase and start learning.
				</>
			)}
		</p>
	)
}

// full component

const LoginLinkComp: React.FC<LoginLinkContextType> = ({ email }) => {
	return (
		<Root email={email}>
			<Status />
			<Title />
			<CTA />
			<Description />
		</Root>
	)
}

export { Root, Title, Description, Status, CTA, LoginLinkComp }
