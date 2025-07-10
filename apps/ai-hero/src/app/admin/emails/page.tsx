import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Email } from '@/lib/emails'
import { getEmails } from '@/lib/emails-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import { FilePlus2, Pencil } from 'lucide-react'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function EmailsIndexEmail() {
	const { ability } = await getServerAuthSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	const allEmails = await getEmails()

	return (
		<main className="container flex flex-col-reverse px-5 lg:flex-row">
			<div className="max-w-(--breakpoint-lg) mx-auto flex w-full flex-col sm:flex-row">
				<div className="flex flex-col items-center border-x">
					<ul className="divide-border relative grid grid-cols-1 justify-center divide-y sm:grid-cols-2">
						{allEmails.slice(1, allEmails.length).map((email, i) => {
							return (
								<EmailTeaser
									i={i}
									email={email}
									key={email.id}
									className="**:data-card:pl-8 **:data-title:transition hover:**:data-title:text-blue-500"
								/>
							)
						})}
					</ul>
				</div>
			</div>
			<React.Suspense
				fallback={
					<aside className="hidden w-full max-w-xs border-r lg:block" />
				}
			>
				<EmailListActions emails={allEmails} />
			</React.Suspense>
		</main>
	)
}

const EmailTeaser: React.FC<{
	email: Email
	i?: number
	className?: string
}> = ({ email, className, i }) => {
	const title = email.fields.title
	const description = email.fields.description
	const createdAt = email.createdAt

	return (
		<li className={cn('flex h-full', className)}>
			<Link href={`/${email.fields.slug}`} passHref className="flex w-full">
				<Card
					data-card=""
					className={cn(
						'mx-auto flex h-full w-full flex-col justify-between rounded-none border-0 bg-transparent p-8 shadow-none',
						{
							'sm:border-r': (i && i % 2 === 0) || i === 0,
						},
					)}
				>
					<div>
						<CardHeader className="p-0">
							<p className="pb-1.5 text-sm opacity-60">
								{createdAt && format(new Date(createdAt), 'MMMM do, y')}
							</p>
							<CardTitle
								data-title=""
								className="text-xl font-semibold leading-tight"
							>
								{title}
							</CardTitle>
						</CardHeader>
						{description && (
							<CardContent className="p-0">
								<p className="text-balance pt-4 text-sm opacity-75">
									{description}
								</p>
							</CardContent>
						)}
					</div>
				</Card>
			</Link>
		</li>
	)
}

async function EmailListActions({ emails }: { emails?: Email[] }) {
	const { ability, session } = await getServerAuthSession()
	return ability.can('create', 'Content') ? (
		<aside className="w-full border-x lg:max-w-xs lg:border-l-0 lg:border-r">
			<div className="border-b p-5">
				<p className="font-semibold">
					Hey {session?.user?.name?.split(' ')[0] || 'there'}!
				</p>
				<p>
					You have <strong className="font-semibold">{emails?.length}</strong>{' '}
					unpublished emails.
				</p>
			</div>
			{emails ? (
				<ul className="flex flex-col px-5 pt-5">
					{emails.map((email) => {
						return (
							<li key={email.id}>
								<Link
									className="group flex flex-col py-2"
									href={`/admin/emails/${email.fields.slug}/edit`}
								>
									<strong className="group-hover:text-primary inline-flex items-baseline gap-1 font-semibold leading-tight transition">
										<Pencil className="text-muted-foreground h-3 w-3 shrink-0" />
										<span>{email.fields.title}</span>
									</strong>
									<div className="text-muted-foreground pl-4 text-sm">
										{email.fields.state}
										{email.fields.state === 'published' &&
											` - ${email.fields.visibility}`}
									</div>
								</Link>
							</li>
						)
					})}
				</ul>
			) : null}
			{ability.can('update', 'Content') ? (
				<div className="p-5">
					<Button variant="outline" asChild className="w-full gap-1">
						<Link href={`/admin/emails/new`}>
							<FilePlus2 className="h-4 w-4" />
							New Email
						</Link>
					</Button>
				</div>
			) : null}
		</aside>
	) : (
		<aside className="hidden w-full max-w-xs border-r lg:block" />
	)
}
