import Link from 'next/link'
import LayoutClient from '@/components/layout-client'
import { env } from '@/env.mjs'
import { Mail } from 'lucide-react'

import { Button } from '@coursebuilder/ui/primitives/button'

/**
 * Error page shown when there's an issue with the checkout process
 * This could be due to invalid checkout URL or other subscription-related errors
 */
export default function SubscribeErrorPage() {
	return (
		<LayoutClient withContainer>
			<div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
				<h1 className="text-4xl font-bold">Oops! Something went wrong</h1>
				<p className="text-muted-foreground mt-4 text-lg">
					We encountered an issue while processing your request.
				</p>
				<div className="mt-8">
					<Button asChild variant="outline" size="lg">
						<Link
							href={`mailto:${env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
							className="flex items-center gap-2"
						>
							<Mail className="h-4 w-4" />
							Contact team
						</Link>
					</Button>
				</div>
			</div>
		</LayoutClient>
	)
}
