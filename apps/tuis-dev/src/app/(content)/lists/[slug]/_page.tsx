/**
 * List page component - used for free tutorial collections.
 *
 * Rendered via the [post]/page.tsx route when resource type is 'list'.
 * Uses shared resource landing components for consistency.
 */

import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import ModuleResourceList from '@/app/(content)/_components/navigation/module-resource-list'
import {
	ResourceActions,
	ResourceAdminActions,
	ResourceBody,
	ResourceHeader,
	ResourceLayout,
	ResourceShareFooter,
	ResourceSidebar,
	ResourceVisibilityBanner,
} from '@/app/(content)/_components/resource-landing'
import LayoutClient from '@/components/layout-client'
import type { List } from '@/lib/lists'
import { getAllLists, getList } from '@/lib/lists-query'
import { getSaleBannerDataFromSearchParams } from '@/lib/sale-banner'
import { compileMDX } from '@/utils/compile-mdx'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'

type Props = {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateStaticParams() {
	const lists = await getAllLists()

	return lists
		.filter((list) => Boolean(list.fields?.slug))
		.map((list) => ({
			slug: list.fields?.slug,
		}))
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const list = await getList(params.slug)

	if (!list) {
		return parent as Metadata
	}

	return {
		title: list.fields.title,
		description: list.fields.description,
		openGraph: {
			images: [
				getOGImageUrlForResource({
					fields: { slug: list.fields.slug },
					id: list.id,
					updatedAt: list.updatedAt,
				}),
			],
		},
	}
}

export default async function ListPage(props: {
	list: List
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const list = props.list
	const searchParams = await props.searchParams
	const saleBannerData = await getSaleBannerDataFromSearchParams(searchParams)

	let body: React.ReactNode | null = null

	if (list.fields.body) {
		const { content } = await compileMDX(list.fields.body)
		body = content
	}

	const fields = list.fields

	return (
		<ResourceLayout
			saleBannerData={saleBannerData}
			sidebar={
				<ResourceSidebar>
					<h2 className="px-5 py-3 text-base font-medium tracking-tight sm:text-lg">
						Contents
					</h2>
					<ModuleResourceList
						className="bg-background"
						options={{ isCollapsible: false, withHeader: false }}
					/>
				</ResourceSidebar>
			}
		>
			<ResourceVisibilityBanner
				visibility={fields.visibility}
				resourceType="list"
			/>
			<ResourceHeader
				visibility={fields.visibility}
				badge={{ label: 'Free Tutorial' }}
				title={fields.title}
				description={fields.description}
				image={
					fields?.image ? { url: fields.image, alt: fields.title } : undefined
				}
				contributor={{ withBio: true, label: 'Created by' }}
				adminActions={
					<ResourceAdminActions
						resourceType="list"
						resourceSlugOrId={list.fields?.slug || list.id}
					/>
				}
			>
				<ResourceActions
					moduleType="list"
					moduleSlug={list.fields.slug}
					hasAccess={true}
					hasProduct={false}
					githubUrl={list?.fields?.github ?? undefined}
					title={list.fields.title}
				/>
			</ResourceHeader>
			<ResourceBody>{body || 'No tutorial body found.'}</ResourceBody>
			<ResourceShareFooter title={list.fields.title} />
		</ResourceLayout>
	)
}
