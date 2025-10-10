import * as React from 'react'
import LayoutClient from '@/components/layout-client'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'

import { CreatePost } from '../_components/create-post'

export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
	return (
		<LayoutClient withContainer>
			<div className="container flex h-full shrink-0 items-center justify-center py-16">
				<main className="mx-auto max-w-4xl">
					<h1 className="mb-8 text-3xl">New Post</h1>
					<CreatePost />
				</main>
			</div>
		</LayoutClient>
	)
}
