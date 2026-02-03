import * as React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Workshop } from '@/lib/workshops'
import { getAllWorkshopsForUser } from '@/lib/workshops/workshops.service'
import { getImpersonatedSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { Presentation } from 'lucide-react'

import { CreateWorkshopModal } from '../../workshops/_components/create-workshop-modal'

/**
 * Page for a contributor to see and manage their workshops.
 */
export default async function WorkshopsIndexPage() {
	const { session, ability } = await getImpersonatedSession()
	const user = session?.user

	if (!user) {
		redirect('/login')
	}

	if (ability.cannot('create', 'Content')) {
		redirect('/')
	}

	const workshops = await getAllWorkshopsForUser(user.id)

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="fluid-3xl font-heading font-bold">Your Workshops</h1>
					{ability.can('create', 'Content') && <CreateWorkshopModal />}
				</div>
				{workshops.length === 0 ? (
					<div className="text-muted-foreground flex flex-col items-center justify-center py-16">
						<Presentation className="mb-4 h-12 w-12 opacity-50" />
						<p className="text-lg">No workshops yet</p>
						<p className="text-sm">Create your first workshop to get started</p>
					</div>
				) : (
					<ul className="divide-border flex flex-col divide-y">
						{workshops.map((workshop) => {
							return <WorkshopTeaser workshop={workshop} key={workshop.id} />
						})}
					</ul>
				)}
			</div>
		</main>
	)
}

/**
 * Renders a teaser for a workshop with a link to its edit page
 * @param workshop - The workshop to display
 * @param className - Optional CSS class name for styling
 */
const WorkshopTeaser: React.FC<{
	workshop: Workshop
	className?: string
}> = ({ workshop, className }) => {
	const title = workshop.fields.title

	return (
		<li className={cn('flex w-full items-center py-4', className)}>
			<Link
				href={`/workshops/${workshop.fields.slug}/edit`}
				passHref
				className="fluid-lg flex w-full items-center gap-3 py-5"
			>
				<Presentation className="text-muted-foreground h-4 w-4" /> {title}
			</Link>
		</li>
	)
}
