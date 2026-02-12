import * as React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { getSubscriptionStatus } from '@/lib/subscriptions'
import { getServerAuthSession } from '@/server/auth'
import { BookOpen, Plus, Users } from 'lucide-react'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function AlreadySubscribedPage() {
	const { session, ability } = await getServerAuthSession()

	if (!session) {
		return redirect('/')
	}

	const { user } = session

	const { hasActiveSubscription } = await getSubscriptionStatus(user?.id)

	if (!hasActiveSubscription) {
		return redirect('/')
	}

	// TODO: we want to make sure that the user can actually do the actions below

	return (
		<LayoutClient withContainer>
			<main className="container min-h-[calc(100vh-var(--nav-height))] border-x px-5 py-8 sm:py-16">
				<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
					<div className="text-center">
						<h1 className="text-3xl font-bold sm:text-4xl">
							You're Already Subscribed!
						</h1>
						<p className="text-muted-foreground mt-4 text-lg">
							Here's what you can do next:
						</p>
					</div>

					<div className="mt-8 grid gap-6 sm:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Manage Team Access
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-4">
								<p className="text-muted-foreground text-sm">
									Add team members or manage existing access to your
									subscription.
								</p>
								<div className="flex flex-col gap-2">
									<Button asChild>
										<Link href="/team">
											<Plus className="mr-2 h-4 w-4" />
											Add Team Members
										</Link>
									</Button>
									<Button variant="outline" asChild>
										<Link href="/team">Manage Team</Link>
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BookOpen className="h-5 w-5" />
									Access Content
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-4">
								<p className="text-muted-foreground text-sm">
									Start learning or continue where you left off.
								</p>
								<div className="flex flex-col gap-2">
									<Button asChild>
										<Link href="/browse">Browse Resources</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="mt-8 text-center">
						<p className="text-muted-foreground text-sm">
							Need help?{' '}
							<Link href="/contact" className="text-primary hover:underline">
								Contact Support
							</Link>
						</p>
					</div>
				</div>
			</main>
		</LayoutClient>
	)
}
