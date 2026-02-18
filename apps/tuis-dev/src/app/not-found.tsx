import Link from 'next/link'
import LayoutClient from '@/components/layout-client'
import { env } from '@/env.mjs'

import { Button } from '@coursebuilder/ui'

export async function generateMetadata() {
	return {
		title: 'Not Found',
		description: 'The page you are looking for does not exist.',
	}
}

export default function NotFound() {
	return (
		<LayoutClient withContainer>
			<main className="flex min-h-[calc(100vh-var(--nav-height))] w-full flex-col items-center justify-center pb-16">
				<h1 className="text-3xl font-semibold">Not Found</h1>
				<p className="pb-8 pt-4">
					The page you are looking for does not exist.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3 gap-y-4">
					<Button asChild>
						<Link href="/browse">Start Learning</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/">Go to Home</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href={`mailto:${env.NEXT_PUBLIC_SUPPORT_EMAIL}`}>
							Contact Us
						</Link>
					</Button>
				</div>
			</main>
		</LayoutClient>
	)
}
