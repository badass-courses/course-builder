'use client'

import { useState } from 'react'
import { SectionManager } from '@/components/section/section-manager'
import { api } from '@/trpc/react'
import { useSession } from 'next-auth/react'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui/primitives/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui/primitives/select'

export default function SectionsPage() {
	const { data: session, status } = useSession()
	const [selectedContentId, setSelectedContentId] = useState<string>('')

	// This would be replaced with a real query to fetch content resources
	// For now, using a placeholder query
	const { data: contentResources } =
		api.contentResources.getAllContent.useQuery(undefined)

	// Set first content resource as selected when data loads
	if (contentResources?.length && !selectedContentId) {
		setSelectedContentId(contentResources[0].id)
	}

	if (status === 'loading') {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2 border-t-2"></div>
			</div>
		)
	}

	if (status === 'unauthenticated') {
		return (
			<div className="container py-12">
				<Card>
					<CardHeader>
						<CardTitle>Access Denied</CardTitle>
						<CardDescription>
							Please sign in to manage sections.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p>You need to be signed in to view and manage content sections.</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="container py-8">
			<h1 className="mb-8 text-3xl font-bold">Section Management</h1>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Select Content</CardTitle>
					<CardDescription>
						Choose the content resource you want to manage sections for.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Select
						value={selectedContentId}
						onValueChange={setSelectedContentId}
					>
						<SelectTrigger className="w-full sm:w-80">
							<SelectValue placeholder="Select a content resource" />
						</SelectTrigger>
						<SelectContent>
							{contentResources?.map((content) => (
								<SelectItem key={content.id} value={content.id}>
									{content.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{selectedContentId && (
				<Card>
					<CardHeader>
						<CardTitle>Section Management</CardTitle>
						<CardDescription>
							Create, edit, and organize sections for the selected content.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<SectionManager contentResourceId={selectedContentId} />
					</CardContent>
				</Card>
			)}
		</div>
	)
}
