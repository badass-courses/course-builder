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
		</>
	)
}
