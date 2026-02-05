'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Icon } from '@/components/brand/icons'
import { env } from '@/env.mjs'
import { Provider } from '@/server/auth'
import { cn } from '@/utils/cn'
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'

import {
	Button,
	Card,
	CardContent,
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	Input,
} from '@coursebuilder/ui'

import { Logo } from './brand/logo'
import { HeroBackground, HeroIllustration } from './brand/svgs'
import { LogoVideo } from './navigation/logo-video'

export type LoginTemplateProps = {
	csrfToken: string
	providers: Record<string, Provider> | null
	image?: React.ReactElement
	title?: string
	subtitle?: string
	callbackUrl?: string
	className?: string
	buttonLabel?: string
	showFirstName?: boolean
	firstNameLabel?: string
	firstNamePlaceholder?: string
}

/**
 * Login component that handles authentication via OAuth providers (Discord, GitHub) and email.
 * Displays error messages and provides a modern card-based UI.
 */
export const Login: React.FC<React.PropsWithChildren<LoginTemplateProps>> = ({
	csrfToken,
	providers = {},
	image,
	title,
	subtitle,
	buttonLabel = 'Email me a login link',
	callbackUrl: callbackUrlProp,
	className,
	showFirstName = false,
	firstNameLabel = 'First Name',
	firstNamePlaceholder = 'Your first name (optional)',
}) => {
	const searchParams = useSearchParams()

	const callbackUrl = callbackUrlProp
		? callbackUrlProp
		: searchParams.get('callbackUrl')
			? (searchParams.get('callbackUrl') as string)
			: '/'

	const message = searchParams.get('message')
		? (searchParams.get('message') as string)
		: null
	const error = searchParams.get('error')
		? (searchParams.get('error') as string)
		: null

	React.useEffect(() => {
		if (message) {
			toast.error(message as string, {
				icon: '⛔️',
			})
		}
		if (error) {
			switch (error) {
				case 'OAuthAccountNotLinked':
					toast.error(
						'Github account NOT connected. Is it already linked? Try logging out and logging in with Github to check.',
						{
							icon: '⛔️',
						},
					)
					break
			}
		}
	}, [message, error])

	const githubProvider = providers?.github
	const discordProvider = providers?.discord
	const emailProvider = providers?.postmark

	return (
		<div className={cn('flex w-full flex-col')}>
			<Card className={cn('overflow-hidden p-0', className)}>
				<CardContent className="p-0">
					<div className="flex flex-col items-center justify-center p-6 md:p-8">
						<FieldGroup>
							<div className="flex flex-col gap-2 text-center">
								<h1 className="text-2xl font-bold">
									{title ? title : 'Welcome back'}
								</h1>
								{subtitle && (
									<p className="text-muted-foreground text-balance">
										{subtitle}
									</p>
								)}
								{error === 'Verification' ? (
									<p className="text-muted-foreground text-balance text-sm">
										That sign in link is no longer valid. It may have been used
										already or it may have expired. Please request a new log in
										link below.{' '}
										<a
											className="text-primary underline underline-offset-2 hover:underline"
											href={`mailto:${env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
										>
											Click here to email us
										</a>{' '}
										if you need help.
									</p>
								) : null}
							</div>

							{emailProvider ? (
								<form method="POST" action={emailProvider.signinUrl}>
									<FieldGroup>
										{showFirstName && (
											<Field>
												<FieldLabel htmlFor="firstName">
													{firstNameLabel}
												</FieldLabel>
												<Input
													id="firstName"
													name="firstName"
													type="text"
													placeholder={firstNamePlaceholder}
												/>
											</Field>
										)}
										<Field>
											<FieldLabel htmlFor="email">Email</FieldLabel>
											<Input
												id="email"
												name="email"
												type="email"
												placeholder="you@example.com"
												required
											/>
										</Field>
										<input
											name="callbackUrl"
											type="hidden"
											defaultValue={callbackUrl}
										/>
										<input
											name="csrfToken"
											type="hidden"
											defaultValue={csrfToken}
										/>
										<Field>
											<Button type="submit" size="lg">
												{buttonLabel}
												<div
													style={{ backgroundSize: '200% 100%' }}
													className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
												/>
											</Button>
										</Field>
									</FieldGroup>
								</form>
							) : null}

							{(githubProvider || discordProvider) && emailProvider && (
								<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
									Or continue with
								</FieldSeparator>
							)}

							{(githubProvider || discordProvider) && (
								<Field className="grid grid-cols-2 gap-4">
									{githubProvider ? (
										<Button
											variant="outline"
											type="button"
											onClick={() =>
												signIn(githubProvider.id, {
													callbackUrl,
												})
											}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 16 16"
												className="mr-2 h-5 w-5"
											>
												<title>GitHub</title>
												<path
													fillRule="evenodd"
													clipRule="evenodd"
													fill="currentColor"
													d="M8,0.2c-4.4,0-8,3.6-8,8c0,3.5,2.3,6.5,5.5,7.6 C5.9,15.9,6,15.6,6,15.4c0-0.2,0-0.7,0-1.4C3.8,14.5,3.3,13,3.3,13c-0.4-0.9-0.9-1.2-0.9-1.2c-0.7-0.5,0.1-0.5,0.1-0.5 c0.8,0.1,1.2,0.8,1.2,0.8C4.4,13.4,5.6,13,6,12.8c0.1-0.5,0.3-0.9,0.5-1.1c-1.8-0.2-3.6-0.9-3.6-4c0-0.9,0.3-1.6,0.8-2.1 c-0.1-0.2-0.4-1,0.1-2.1c0,0,0.7-0.2,2.2,0.8c0.6-0.2,1.3-0.3,2-0.3c0.7,0,1.4,0.1,2,0.3c1.5-1,2.2-0.8,2.2-0.8 c0.4,1.1,0.2,1.9,0.1,2.1c0.5,0.6,0.8,1.3,0.8,2.1c0,3.1-1.9,3.7-3.7,3.9C9.7,12,10,12.5,10,13.2c0,1.1,0,1.9,0,2.2 c0,0.2,0.1,0.5,0.6,0.4c3.2-1.1,5.5-4.1,5.5-7.6C16,3.8,12.4,0.2,8,0.2z"
												/>
											</svg>
											<span className="sr-only">Login with GitHub</span>
										</Button>
									) : null}
									{discordProvider ? (
										<Button
											variant="outline"
											type="button"
											onClick={() =>
												signIn(discordProvider.id, {
													callbackUrl,
												})
											}
										>
											<Icon
												className="mr-2 flex items-center justify-center"
												name="Discord"
												size="20"
											/>
											<span className="sr-only">Login with Discord</span>
										</Button>
									) : null}
								</Field>
							)}
						</FieldGroup>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
