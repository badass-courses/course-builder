import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { getPage } from '@/lib/pages-query'
import { getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { and, eq, inArray, sql } from 'drizzle-orm'

import AppTourVideo from './_components/app-tour-video'
import GetStartedClient from './_components/get-started-client'
import ThemeAwareImage from './_components/theme-aware-image'
import WorkshopsComponent from './_components/workshops'

/**
 * Simple fetch for workshops with product/cohort info for the get-started page
 */
async function getWorkshopsWithGroups() {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']

	const workshops = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'workshop'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
		),
		with: {
			resourceProducts: {
				with: {
					product: true,
				},
			},
			resourceOf: {
				with: {
					resourceOf: true,
				},
			},
		},
	})

	// Sort by position in parent resource (product or cohort)
	return workshops.sort((a, b) => {
		const posA =
			a.resourceProducts?.[0]?.position ??
			a.resourceOf?.[0]?.position ??
			Number.MAX_SAFE_INTEGER
		const posB =
			b.resourceProducts?.[0]?.position ??
			b.resourceOf?.[0]?.position ??
			Number.MAX_SAFE_INTEGER
		return posA - posB
	})
}

export default async function GetStartedPage() {
	const page = await getPage('get-started-6pc7h')
	if (!page) {
		notFound()
	}

	const workshops = await getWorkshopsWithGroups()

	// Get user's purchased products
	const { session } = await getServerAuthSession()
	const userProductIds = new Set<string>()

	if (session?.user?.id) {
		const purchases = await courseBuilderAdapter.getPurchasesForUser(
			session.user.id,
		)
		purchases
			.filter((p) => ['Valid', 'Restricted'].includes(p.status))
			.forEach((p) => userProductIds.add(p.productId))
	}

	const { content } = await compileMDX(page.fields.body || '', {
		AppTourVideo,
		Workshops: () => (
			<WorkshopsComponent
				workshops={workshops as any}
				userProductIds={userProductIds}
			/>
		),
		Image: ThemeAwareImage,
	})

	const pageTitle = page.fields.title || 'Get Started Using the Workshop App'
	const pageDescription =
		page.fields.description ||
		"From setting up your environment to navigating exercises and understanding the Epic Workshop App's structure, this guide ensures a smooth workshop experience."

	return (
		<LayoutClient withContainer>
			<GetStartedClient
				page={page}
				workshops={workshops as any}
				pageTitle={pageTitle}
				pageDescription={pageDescription}
			>
				{content}
			</GetStartedClient>
		</LayoutClient>
	)
}
