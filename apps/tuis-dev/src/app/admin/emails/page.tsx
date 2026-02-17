import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Email } from '@/lib/emails'
import { getEmails } from '@/lib/emails-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { FilePlus2, Mail } from 'lucide-react'

import { Badge, Button } from '@coursebuilder/ui'

export default async function EmailsIndexPage() {
	const { ability } = await getServerAuthSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	const allEmails = await getEmails()

	return (
		<main className="flex w-full flex-1 flex-col gap-5">
			<div className="flex w-full flex-col gap-5">
				<div className="flex w-full items-center justify-between">
					<h1 className="font-heading text-xl font-bold sm:text-3xl">Emails</h1>
					<Button asChild className="gap-1">
						<Link href="/admin/emails/new">
							<FilePlus2 className="h-4 w-4" />
							New Email
						</Link>
					</Button>
				</div>
				{allEmails.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center text-sm">
						No emails yet.
					</div>
				) : (
					<ul className="divide-border flex flex-col divide-y">
						{allEmails.map((email) => (
							<EmailTeaser key={email.id} email={email} />
						))}
					</ul>
				)}
			</div>
		</main>
	)
}

const EmailTeaser: React.FC<{ email: Email }> = ({ email }) => {
	const title = email.fields.title

	return (
		<li className="flex w-full items-center py-4">
			<Link
				href={`/admin/emails/${email.fields.slug}/edit`}
				passHref
				className="flex w-full items-center gap-3 py-1 text-lg"
			>
				<Mail className="text-muted-foreground h-4 w-4" />
				{title}
				{email.fields.state && (
					<Badge variant="outline" className="text-xs capitalize">
						{email.fields.state}
					</Badge>
				)}
			</Link>
		</li>
	)
}
