import * as React from 'react'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'

import { CreatePost } from '../_components/create-post'

export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
	return (
		<div className="container flex h-full flex-shrink-0 items-center justify-center py-16">
			<main className="mx-auto max-w-4xl">
				<h1 className="fluid-3xl mb-8">New Post</h1>
				<CreatePost />
			</main>
		</div>
	)
}
