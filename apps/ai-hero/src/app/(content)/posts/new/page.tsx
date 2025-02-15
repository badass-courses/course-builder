import * as React from 'react'
import { PostAssistant } from '@/components/post-assistant/post-assistant'
import { Bot } from 'lucide-react'

import { CreatePost } from '../_components/create-post'

export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
	return (
		<div className="container flex h-full flex-shrink-0 items-center justify-center py-16">
			<main className="mx-auto flex w-full max-w-screen-sm flex-col gap-10">
				<div>
					<h1 className="fluid-xl inline-flex items-center gap-2">
						<Bot className="text-muted-foreground w-5" /> Post Assistant
					</h1>
					<p className="text-muted-foreground mb-5 text-sm">
						Direct the Assistant to create multiple posts or update an existing
						one.
					</p>
					<PostAssistant />
				</div>
				<div className="bg-card rounded border p-5 opacity-50 blur-sm">
					<h1 className="fluid-2xl mb-8">New Post</h1>
					<CreatePost />
				</div>
			</main>
		</div>
	)
}
