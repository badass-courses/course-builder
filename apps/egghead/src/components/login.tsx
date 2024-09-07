'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { env } from '@/env.mjs'
import { Provider } from '@/server/auth'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Balancer from 'react-wrap-balancer'

import { Button, Input, Label } from '@coursebuilder/ui'

import { Icon } from './icons'

export type LoginTemplateProps = {
	csrfToken: string
	providers: Record<string, Provider> | null
	image?: React.ReactElement
	title?: string
	subtitle?: string
}

export const Login: React.FC<React.PropsWithChildren<LoginTemplateProps>> = ({
	csrfToken,
	providers = {},
	image,
	title,
	subtitle,
}) => {
	const {
		register,
		formState: { errors },
	} = useForm()

	const searchParams = useSearchParams()

	const callbackUrl = searchParams.get('callbackUrl')
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
	const emailProvider = providers?.nodemailer
	const eggheadProvider = providers?.egghead

	return (
		<main data-login-template="">
			{image ? image : null}
			<h1 data-title="">
				<Balancer>
					{title ? title : `Log in to ${env.NEXT_PUBLIC_SITE_TITLE}`}
				</Balancer>
				{subtitle && <span data-subtitle="">{subtitle}</span>}
			</h1>
			{error === 'Verification' ? (
				<p data-verification-error="">
					<Balancer>
						That sign in link is no longer valid. It may have been used already
						or it may have expired. Please request a new log in link below.{' '}
						<a
							className="text-primary underline"
							href={`mailto:${env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
						>
							Click here to email us
						</a>{' '}
						if you need help.
					</Balancer>
				</p>
			) : null}

			<div data-providers-container="">
				{eggheadProvider ? (
					<Button
						data-button=""
						variant="outline"
						onClick={() =>
							signIn(eggheadProvider.id, {
								callbackUrl,
							})
						}
					>
						<Icon
							className="mr-2 flex items-center justify-center"
							name="egghead"
							size="32"
						/>
						sign in with {eggheadProvider.name}
					</Button>
				) : null}
			</div>
		</main>
	)
}
