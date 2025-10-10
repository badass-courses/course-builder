'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListTypeSchema } from '@/lib/lists'
import { createList } from '@/lib/lists-query'

import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from '@coursebuilder/ui'

export function CreateListForm() {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [listType, setListType] = useState('nextUp')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			setIsLoading(true)
			await createList({ title, description, listType })
			setTitle('')
			setDescription('')
			setListType('')
			router.refresh()
		} finally {
			setIsLoading(false)
		}
	}
	const listTypeOptions = ListTypeSchema.options

	return (
		<form
			onSubmit={handleSubmit}
			className="w-full max-w-md shrink-0 space-y-4"
		>
			<h2 className="text-xl">Create New List</h2>
			<div>
				<Label htmlFor="title" className="mb-1 block text-sm font-medium">
					Title
				</Label>
				<Input
					type="text"
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					// className="block w-full rounded-md border border-gray-300 px-3 py-2"
					required
				/>
			</div>
			<div>
				<Label htmlFor="listType" className="mb-1 block text-sm font-medium">
					Type
				</Label>
				<Select
					name="listType"
					onValueChange={(value) => {
						setListType(value)
					}}
					defaultValue={listType || 'nextUp'}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select list type..." />
					</SelectTrigger>
					<SelectContent>
						{listTypeOptions.map((type) => (
							<SelectItem key={type} value={type}>
								{type.charAt(0).toUpperCase() + type.slice(1)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div>
				<Label htmlFor="description" className="mb-1 block text-sm font-medium">
					Description (optional)
				</Label>
				<Textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					// className="block w-full rounded-md border border-gray-300 px-3 py-2"
					rows={3}
				/>
			</div>
			<Button type="submit" disabled={isLoading}>
				{isLoading ? 'Creating...' : 'Create List'}
			</Button>
		</form>
	)
}
