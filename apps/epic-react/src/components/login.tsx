'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { env } from '@/env.mjs'
import { Provider } from '@/server/auth'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Balancer from 'react-wrap-balancer'

import { Button } from '@coursebuilder/ui'

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
				{githubProvider ? (
					<Button
						data-button=""
						variant="outline"
						onClick={() =>
							signIn(githubProvider.id, {
								callbackUrl,
							})
						}
					>
						<svg
							width={20}
							height={20}
							viewBox={'0 0 16 16'}
							role={'img'}
							className="mr-2 flex items-center justify-center"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>{'Github'}</title>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								fill="currentColor"
								d="M8,0.2c-4.4,0-8,3.6-8,8c0,3.5,2.3,6.5,5.5,7.6 C5.9,15.9,6,15.6,6,15.4c0-0.2,0-0.7,0-1.4C3.8,14.5,3.3,13,3.3,13c-0.4-0.9-0.9-1.2-0.9-1.2c-0.7-0.5,0.1-0.5,0.1-0.5 c0.8,0.1,1.2,0.8,1.2,0.8C4.4,13.4,5.6,13,6,12.8c0.1-0.5,0.3-0.9,0.5-1.1c-1.8-0.2-3.6-0.9-3.6-4c0-0.9,0.3-1.6,0.8-2.1 c-0.1-0.2-0.4-1,0.1-2.1c0,0,0.7-0.2,2.2,0.8c0.6-0.2,1.3-0.3,2-0.3c0.7,0,1.4,0.1,2,0.3c1.5-1,2.2-0.8,2.2-0.8 c0.4,1.1,0.2,1.9,0.1,2.1c0.5,0.6,0.8,1.3,0.8,2.1c0,3.1-1.9,3.7-3.7,3.9C9.7,12,10,12.5,10,13.2c0,1.1,0,1.9,0,2.2 c0,0.2,0.1,0.5,0.6,0.4c3.2-1.1,5.5-4.1,5.5-7.6C16,3.8,12.4,0.2,8,0.2z"
							/>
						</svg>
						Log in with {githubProvider.name}
					</Button>
				) : null}
			</div>
		</main>
	)
}
