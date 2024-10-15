import * as React from 'react'
import { GetServerSideProps } from 'next'
import { redirect } from 'next/navigation'
import { useRouter } from 'next/router'
import { Layout } from '@/components/app/layout'
import { getServerAuthSession } from '@/server/auth'
import { api } from '@/trpc/react'

import Verify from './_components/verifiy'

export default async function Activate({
	searchParams,
}: {
	searchParams: { user_code: string }
}) {
	const { session } = await getServerAuthSession()
	const userCode = searchParams.user_code
	const unAuthedCallbackUrl = `/activate%3Fuser_code=${userCode}`

	if (!session) {
		redirect(
			`/login?callbackUrl=${unAuthedCallbackUrl}&message=You must be logged in to activate your device.`,
		)
	}

	return (
		<Layout>
			<Verify userCode={userCode} />
		</Layout>
	)
}
