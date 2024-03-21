'use client'

import { Icon } from '@/components/icons'
import { signIn, useSession } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

import LandingCopy from './landing-copy.mdx'

export const Landing = () => {
	const { data: session, status } = useSession()
	return (
		<>
			<LandingCopy />
			{status === 'unauthenticated' ? (
				<div className="flex flex-col items-center">
					<h2 className="mb-8 text-xl font-bold text-gray-900 dark:text-gray-100">
						Want to Learn More About Course Builder?
					</h2>
					<Button
						data-button=""
						size="lg"
						onClick={() =>
							signIn('github', {
								callbackUrl: '/',
							})
						}
					>
						<Icon
							className="mr-2 flex items-center justify-center"
							name="Github"
							size="20"
						/>
						Signup with Github for Updates
					</Button>
				</div>
			) : null}
		</>
	)
}
