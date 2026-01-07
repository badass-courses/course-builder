import * as React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getAllTutorials } from '@/lib/tutorials-query'
import { getImpersonatedSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { BookOpen } from 'lucide-react'

import { CreateResourceModals } from '../../_components/create-resource-modals'

/**
 * Page for a contributor to see and manage their tutorials.
 */
export default async function TutorialsIndexPage() {
	const { session, ability } = await getImpersonatedSession()
	const user = session?.user

	if (!user) {
		redirect('/login')
	}

	if (ability.cannot('create', 'Content')) {
		notFound()
	}

	// Get all tutorials (for now, we'll filter by user later if needed)
	const tutorials = await getAllTutorials()

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="fluid-3xl font-heading font-bold">Your Tutorials</h1>
					{ability.can('create', 'Content') && (
						<CreateResourceModals isAdmin={false} />
					)}
				</div>
				<ul className="divide-border flex flex-col divide-y">
					{tutorials.map((tutorial) => {
						return <TutorialTeaser tutorial={tutorial} key={tutorial.id} />
					})}
				</ul>
			</div>
		</main>
	)
}

/**
 * Renders a teaser for a tutorial with a link to its edit page
 * @param tutorial - The tutorial to display
 * @param className - Optional CSS class name for styling
 */
const TutorialTeaser: React.FC<{
	tutorial: {
		id: string
		fields: {
			title: string
			slug: string
		}
	}
	className?: string
}> = ({ tutorial, className }) => {
	const title = tutorial.fields.title
	const slug = tutorial.fields.slug

	return (
		<li className={cn('flex w-full items-center py-4', className)}>
			<Link
				href={`/lists/${slug}/edit`}
				passHref
				className="fluid-lg flex w-full items-center gap-3 py-5"
			>
				<BookOpen className="text-muted-foreground h-4 w-4" /> {title}
			</Link>
		</li>
	)
}
