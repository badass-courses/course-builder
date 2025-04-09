import * as React from 'react'
import { redirect } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { getServerAuthSession } from '@/server/auth'

import Verify from './_components/verifiy'

export default async function Activate(props: {
	searchParams: Promise<{ user_code: string }>
}) {
	const searchParams = await props.searchParams
	const { session } = await getServerAuthSession()
	const userCode = searchParams.user_code
	const unAuthedCallbackUrl = `/activate%3Fuser_code=${userCode}`

	if (!session) {
		redirect(
			`/login?callbackUrl=${unAuthedCallbackUrl}&message=You must be logged in to activate your device.`,
		)
	}

	return (
		<LayoutClient withContainer>
			<Verify userCode={userCode} />
		</LayoutClient>
	)
}
