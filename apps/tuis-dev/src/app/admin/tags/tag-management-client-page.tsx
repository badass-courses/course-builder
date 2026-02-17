'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Tag } from '@/lib/tags'
import { createTag, updateTag } from '@/lib/tags-query'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
} from '@coursebuilder/ui'

import TagCrudDialog from './tag-crud-dialog'

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}

export default function TagManagement({ initialTags }: { initialTags: Tag[] }) {
	const [tags, setTags] = useState<Tag[]>(initialTags)
	const [searchTerm, setSearchTerm] = useState('')
	const debouncedSearchTerm = useDebounce(searchTerm, 250)
	const [deleteConfirmation, setDeleteConfirmation] = useState<{
		isOpen: boolean
		tagId: string | null
	}>({ isOpen: false, tagId: null })

	const filteredTags = useCallback(() => {
		return tags.filter(
			(tag) =>
				tag?.fields?.name
					.toLowerCase()
					.includes(debouncedSearchTerm.toLowerCase()) ||
				tag?.fields?.label
					.toLowerCase()
					.includes(debouncedSearchTerm.toLowerCase()),
		)
	}, [tags, debouncedSearchTerm])

	const handleCreate = async (newTag: Tag) => {
		await createTag(newTag)
		setTags([...tags, newTag])
	}

	const handleEdit = async (updatedTag: Tag) => {
		await updateTag(updatedTag)
		setTags(tags.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag)))
	}

	const handleDeleteConfirmation = (id: string) => {
		setDeleteConfirmation({ isOpen: true, tagId: id })
	}

	const handleDelete = () => {
		if (deleteConfirmation.tagId) {
			setTags(tags.filter((tag) => tag.id !== deleteConfirmation.tagId))
			setDeleteConfirmation({ isOpen: false, tagId: null })
		}
	}

	return (
		<main className="flex w-full flex-1 flex-col gap-5">
			<div className="flex w-full flex-col gap-5">
				<h1 className="font-heading text-xl font-bold sm:text-3xl">Tags</h1>

				<div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search tags..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-8"
						/>
					</div>
					<TagCrudDialog onSubmit={handleCreate}>
						<Button className="w-full sm:w-auto">
							<Plus className="mr-2 h-4 w-4" /> Add New Tag
						</Button>
					</TagCrudDialog>
				</div>

				<div className="hidden overflow-hidden rounded-lg shadow-sm sm:block">
					{/* Desktop view: Table */}
					<table className="divide-border min-w-full divide-y">
						<thead className="">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Label
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Slug
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Contexts
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Image
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-border divide-y">
							{filteredTags().map((tag) => (
								<tr
									key={tag.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-900"
								>
									<td className="whitespace-nowrap px-6 py-4">
										{tag?.fields?.label}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										{tag?.fields?.name}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										{tag?.fields?.slug}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										{tag?.fields?.contexts?.join(', ')}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										{tag?.fields?.image_url && (
											<Image
												src={tag?.fields?.image_url}
												alt={tag?.fields?.label}
												width={40}
												height={40}
												className="rounded object-cover"
											/>
										)}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										<div className="flex space-x-2">
											<TagCrudDialog tag={tag} onSubmit={handleEdit}>
												<Button variant="outline" size="icon">
													<Pencil className="h-4 w-4" />
												</Button>
											</TagCrudDialog>
											<Button
												variant="destructive"
												size="icon"
												onClick={() => handleDeleteConfirmation(tag.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="space-y-4 sm:hidden">
					{/* Mobile view: Card-like layout */}
					{filteredTags().map((tag) => (
						<div key={tag.id} className="overflow-hidden rounded-lg shadow-sm">
							<div className="border-b border-gray-200 px-4 py-5 sm:px-6">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-medium leading-6 text-gray-900">
										{tag?.fields?.label}
									</h3>
									<div className="flex space-x-2">
										<TagCrudDialog tag={tag} onSubmit={handleEdit}>
											<Button variant="outline" size="icon">
												<Pencil className="h-4 w-4" />
											</Button>
										</TagCrudDialog>
										<Button
											variant="destructive"
											size="icon"
											onClick={() => handleDeleteConfirmation(tag.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
							<div className="px-4 py-5 sm:p-6">
								<dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
									<div className="sm:col-span-1">
										<dt className="text-sm font-medium text-gray-500">Name</dt>
										<dd className="mt-1 text-sm text-gray-900">
											{tag?.fields?.name}
										</dd>
									</div>
									<div className="sm:col-span-1">
										<dt className="text-sm font-medium text-gray-500">Slug</dt>
										<dd className="mt-1 text-sm text-gray-900">
											{tag?.fields?.slug}
										</dd>
									</div>
									<div className="sm:col-span-2">
										<dt className="text-sm font-medium text-gray-500">
											Contexts
										</dt>
										<dd className="mt-1 text-sm text-gray-900">
											{tag?.fields?.contexts?.join(', ')}
										</dd>
									</div>
									{tag?.fields?.image_url && (
										<div className="sm:col-span-2">
											<dt className="text-sm font-medium text-gray-500">
												Image
											</dt>
											<dd className="mt-1 text-sm text-gray-900">
												<Image
													src={tag.fields.image_url}
													alt={tag.fields.label}
													width={40}
													height={40}
													className="rounded object-cover"
												/>
											</dd>
										</div>
									)}
								</dl>
							</div>
						</div>
					))}
				</div>
			</div>

			<Dialog
				open={deleteConfirmation.isOpen}
				onOpenChange={(isOpen) =>
					setDeleteConfirmation({ ...deleteConfirmation, isOpen })
				}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this tag? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() =>
								setDeleteConfirmation({ isOpen: false, tagId: null })
							}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	)
}
