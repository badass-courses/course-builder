import Link from 'next/link'

import { Button } from '@coursebuilder/ui'

export default function NotFoundPage() {
	return (
		<main className="flex min-h-[60vh] flex-col items-center justify-center px-5">
			<h1 className="fluid-3xl font-heading mb-4 font-bold">404</h1>
			<p className="text-muted-foreground mb-8 text-lg">
				Page not found or you don't have access.
			</p>
			<Button asChild>
				<Link href="/">Go Home</Link>
			</Button>
		</main>
	)
}
