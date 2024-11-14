import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { EditEmailsForm } from '@/app/admin/emails/_components/edit-emails-form'
import { getEmail } from '@/lib/emails-query'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function ArticleEditEmail(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	await headers()
	const { ability } = await getServerAuthSession()
	const email = await getEmail(params.slug)

	if (!email || !ability.can('create', 'Content')) {
		notFound()
	}

	return <EditEmailsForm key={email.fields.slug} email={email} />
}
