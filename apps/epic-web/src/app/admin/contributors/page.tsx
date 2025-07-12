import * as React from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getContributors } from '@/lib/contributors-query'
import { getImpersonatedSession } from '@/server/auth'
import { log } from '@/server/logger'

import { Alert, AlertDescription, Button, Gravatar } from '@coursebuilder/ui'

import { signInAs, stopImpersonating } from './actions'

export const metadata: Metadata = {
	title: 'Contributors | Epic Web',
}

export default async function ContributorsPage() {
	// Initialize with default values
	let session = null
	let isImpersonating = false
	let originalUserId = null
	let contributors: any[] = []
	let sessionError = false
	let contributorsError = false

	// Handle session retrieval with error handling
	try {
		const sessionResult = await getImpersonatedSession()
		session = sessionResult.session
		isImpersonating = sessionResult.isImpersonating
		originalUserId = sessionResult.originalUserId
	} catch (error) {
		log.error('Failed to retrieve impersonated session in contributors page', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		sessionError = true
	}

	// Handle contributors retrieval with error handling
	try {
		contributors = await getContributors()
	} catch (error) {
		log.error('Failed to retrieve contributors list', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		contributorsError = true
	}

	return (
		<main className="container px-5">
			{sessionError && (
				<Alert className="mb-5 border-red-200 bg-red-50">
					<AlertDescription className="text-red-800">
						Failed to load session information. Some features may not work
						correctly.
					</AlertDescription>
				</Alert>
			)}

			{isImpersonating && session?.user && (
				<Alert className="mb-5 border-yellow-200 bg-yellow-50">
					<AlertDescription className="flex items-center justify-between">
						<p className="text-yellow-800">
							You are currently impersonating{' '}
							<span className="font-semibold">
								{session.user.name || session.user.email}
							</span>
							.
						</p>
						<form action={stopImpersonating}>
							<Button variant="outline" size="sm">
								Stop Impersonating
							</Button>
						</form>
					</AlertDescription>
				</Alert>
			)}

			<h1 className="mb-6 text-3xl font-bold">Contributors</h1>

			{contributorsError ? (
				<Alert className="mb-5 border-red-200 bg-red-50">
					<AlertDescription className="text-red-800">
						Failed to load contributors. Please try refreshing the page or
						contact support if the problem persists.
					</AlertDescription>
				</Alert>
			) : contributors.length === 0 ? (
				<p className="text-muted-foreground">No contributors found.</p>
			) : (
				<ul className="space-y-4">
					{contributors.map((contributor) => (
						<li
							key={contributor.id}
							className="flex items-center justify-between rounded-lg border p-4"
						>
							<div className="flex items-center gap-4">
								{contributor.image ? (
									<Image
										src={contributor.image}
										alt={contributor.name || ''}
										width={40}
										height={40}
										className="rounded-full"
									/>
								) : (
									<Gravatar
										email={contributor.email}
										size={40}
										className="rounded-full"
									/>
								)}
								<div>
									<p className="font-semibold">
										{contributor.name || 'Unnamed Contributor'}
									</p>
									<p className="text-muted-foreground text-sm">
										{contributor.email}
									</p>
								</div>
							</div>
							<form action={signInAs}>
								<input type="hidden" name="userId" value={contributor.id} />
								<input
									type="hidden"
									name="adminId"
									value={originalUserId || session?.user?.id || ''}
								/>
								<Button disabled={isImpersonating || sessionError}>
									Sign in as
								</Button>
							</form>
						</li>
					))}
				</ul>
			)}
		</main>
	)
}
