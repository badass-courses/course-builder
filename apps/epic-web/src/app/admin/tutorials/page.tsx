import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllTutorials } from '@/lib/tutorials-query'
import { getImpersonatedSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { BookOpen } from 'lucide-react'

import { CreateResourceModals } from '../../_components/create-resource-modals'

/**
 * Admin page for managing tutorials.
 * Requires 'manage all' permissions to access.
 */
export default async function TutorialsIndexPage() {
	const { ability } = await getImpersonatedSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}
	const allTutorials = await getAllTutorials()

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="fluid-3xl font-heading font-bold">Tutorials</h1>

					<CreateResourceModals isAdmin={true} />
				</div>
				<ul className="divide-border flex flex-col divide-y">
					{allTutorials.map((tutorial) => {
						return (
							<TutorialTeaser
								tutorial={tutorial}
								key={tutorial.id}
								className="flex w-full items-center py-4"
							/>
						)
					})}
				</ul>
			</div>
		</main>
	)
}

/**
 * Displays a single tutorial entry inside the Tutorials admin list.
 *
 * @param tutorial - The tutorial resource to display.
 * @param className - Optional additional CSS classes to apply to the list item element.
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
		<li className={cn('', className)}>
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
