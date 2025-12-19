import type { Metadata, ResolvingMetadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getList } from '@/lib/lists-query'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { EditListOrTutorialForm } from './_components/edit-list-or-tutorial-form'

export const dynamic = 'force-dynamic'

type Props = {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const tutorial = await getTutorial(params.slug)
	const list = tutorial ? null : await getList(params.slug)
	const resource = tutorial || list

	if (!resource) {
		return parent as Metadata
	}

	return {
		title: `📝 ${resource.fields.title}`,
	}
}

/**
 * Edit page for both lists and tutorials.
 * Tutorials route to /lists/[slug]/edit, so this page handles both resource types.
 */
export default async function ListOrTutorialEditPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	const { ability } = await getServerAuthSession()

	const tutorial = await getTutorial(params.slug)

	if (tutorial) {
		if (!ability.can('create', 'Content')) {
			notFound()
		}

		if (ability.cannot('manage', subject('Content', tutorial))) {
			redirect(`/${tutorial.fields?.slug}`)
		}

		// Serialize the resource to remove Date objects and other non-serializable data
		const serializedTutorial = JSON.parse(
			JSON.stringify(tutorial, (key, value) => {
				if (value instanceof Date) {
					return value.toISOString()
				}
				return value
			}),
		) as ContentResource

		return (
			<EditListOrTutorialForm
				key={tutorial.fields.slug}
				resource={serializedTutorial}
				resourceType="tutorial"
			/>
		)
	}

	const list = await getList(params.slug)

	if (!list || !ability.can('create', 'Content')) {
		notFound()
	}

	if (ability.cannot('manage', subject('Content', list))) {
		redirect(`/${list?.fields?.slug}`)
	}

	const serializedList = JSON.parse(
		JSON.stringify(list, (key, value) => {
			if (value instanceof Date) {
				return value.toISOString()
			}
			return value
		}),
	) as ContentResource

	return (
		<EditListOrTutorialForm
			key={list.fields.slug}
			resource={serializedList}
			resourceType="list"
		/>
	)
}
