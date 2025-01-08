'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createList } from '@/lib/lists-query'

import { Button, Input, Label, Textarea } from '@coursebuilder/ui'

export function CreateListForm() {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			setIsLoading(true)
			await createList({ title, description })
			setTitle('')
			setDescription('')
			router.refresh()
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<Label htmlFor="title" className="mb-1 block text-sm font-medium">
					Title
				</Label>
				<Input
					type="text"
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="block w-full rounded-md border border-gray-300 px-3 py-2"
					required
				/>
			</div>
			<div>
				<Label htmlFor="description" className="mb-1 block text-sm font-medium">
					Description (optional)
				</Label>
				<Textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="block w-full rounded-md border border-gray-300 px-3 py-2"
					rows={3}
				/>
			</div>
			<Button type="submit" disabled={isLoading}>
				{isLoading ? 'Creating...' : 'Create List'}
			</Button>
		</form>
	)
}
