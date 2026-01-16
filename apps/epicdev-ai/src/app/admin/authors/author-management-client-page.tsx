'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { User } from '@/ability'
import { api } from '@/trpc/react'
import { Pencil, Plus, Search, Trash2, User as UserIcon } from 'lucide-react'

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

import AuthorCrudDialog from './author-crud-dialog'

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

/**
 * Client component for managing authors.
 * Displays list of users with author role and allows adding/removing the role.
 */
export default function AuthorManagement({
	initialAuthors,
}: {
	initialAuthors: User[]
}) {
	const [authors, setAuthors] = useState<User[]>(initialAuthors)
	const [searchTerm, setSearchTerm] = useState('')
	const debouncedSearchTerm = useDebounce(searchTerm, 250)
	const [deleteConfirmation, setDeleteConfirmation] = useState<{
		isOpen: boolean
		userId: string | null
	}>({ isOpen: false, userId: null })
	const [editDialog, setEditDialog] = useState<{
		isOpen: boolean
		userId: string | null
		name: string
	}>({ isOpen: false, userId: null, name: '' })

	const utils = api.useUtils()
	const { data: authorsData, refetch } = api.authors.getAuthors.useQuery(
		undefined,
		{
			initialData: initialAuthors,
		},
	)

	// Update local state when query data changes
	useEffect(() => {
		if (authorsData) {
			setAuthors(authorsData)
		}
	}, [authorsData])

	const filteredAuthors = useCallback(() => {
		return authors.filter(
			(author) =>
				author?.name
					?.toLowerCase()
					.includes(debouncedSearchTerm.toLowerCase()) ||
				author?.email
					?.toLowerCase()
					.includes(debouncedSearchTerm.toLowerCase()),
		)
	}, [authors, debouncedSearchTerm])

	const createAuthorMutation = api.authors.createAuthor.useMutation({
		onSuccess: async () => {
			await utils.authors.getAuthors.invalidate()
			await refetch()
		},
	})

	const updateAuthorNameMutation = api.authors.updateAuthorName.useMutation({
		onSuccess: async () => {
			await utils.authors.getAuthors.invalidate()
			await refetch()
			setEditDialog({ isOpen: false, userId: null, name: '' })
		},
	})

	const deleteAuthorMutation = api.authors.deleteAuthor.useMutation({
		onSuccess: async () => {
			await utils.authors.getAuthors.invalidate()
			await refetch()
			setDeleteConfirmation({ isOpen: false, userId: null })
		},
	})

	const handleCreate = async (email: string, name: string) => {
		await createAuthorMutation.mutateAsync({ email, name })
	}

	const handleEdit = (author: User) => {
		setEditDialog({
			isOpen: true,
			userId: author.id,
			name: author.name || '',
		})
	}

	const handleUpdateName = async () => {
		if (editDialog.userId && editDialog.name.trim()) {
			await updateAuthorNameMutation.mutateAsync({
				userId: editDialog.userId,
				name: editDialog.name.trim(),
			})
		}
	}

	const handleDelete = async () => {
		if (deleteConfirmation.userId) {
			await deleteAuthorMutation.mutateAsync({
				userId: deleteConfirmation.userId,
			})
		}
	}

	return (
		<main className="flex w-full flex-col p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<h1 className="fluid-3xl font-heading font-bold">Authors</h1>

				<div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search authors..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-8"
						/>
					</div>
					<AuthorCrudDialog onSubmit={handleCreate}>
						<Button className="w-full sm:w-auto">
							<Plus className="mr-2 h-4 w-4" /> Add Author
						</Button>
					</AuthorCrudDialog>
				</div>

				<div className="hidden overflow-hidden rounded-lg shadow-sm sm:block">
					{/* Desktop view: Table */}
					<table className="divide-border min-w-full divide-y">
						<thead className="">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Email
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Avatar
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Role
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-border divide-y">
							{filteredAuthors().map((author) => (
								<tr
									key={author.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-900"
								>
									<td className="whitespace-nowrap px-6 py-4">
										{author?.name || 'No name'}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										{author?.email}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										{author?.image ? (
											<Image
												src={author.image}
												alt={author.name || 'Author'}
												width={40}
												height={40}
												className="rounded-full object-cover"
											/>
										) : (
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
												<UserIcon className="h-5 w-5 text-gray-500" />
											</div>
										)}
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										<span className="bg-primary/20 text-primary rounded-full px-2 py-1 text-xs font-semibold">
											Author
										</span>
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										<div className="flex space-x-2">
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleEdit(author)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="destructive"
												size="icon"
												onClick={() =>
													setDeleteConfirmation({
														isOpen: true,
														userId: author.id,
													})
												}
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
					{filteredAuthors().map((author) => (
						<div
							key={author.id}
							className="overflow-hidden rounded-lg shadow-sm"
						>
							<div className="border-b border-gray-200 px-4 py-5 sm:px-6">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										{author?.image ? (
											<Image
												src={author.image}
												alt={author.name || 'Author'}
												width={40}
												height={40}
												className="rounded-full object-cover"
											/>
										) : (
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
												<UserIcon className="h-5 w-5 text-gray-500" />
											</div>
										)}
										<div>
											<h3 className="text-lg font-medium leading-6 text-gray-900">
												{author?.name || 'No name'}
											</h3>
											<p className="text-sm text-gray-500">{author?.email}</p>
										</div>
									</div>
									<div className="flex space-x-2">
										<Button
											variant="outline"
											size="icon"
											onClick={() => handleEdit(author)}
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="destructive"
											size="icon"
											onClick={() =>
												setDeleteConfirmation({
													isOpen: true,
													userId: author.id,
												})
											}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
							<div className="px-4 py-5 sm:p-6">
								<div className="flex items-center gap-2">
									<span className="bg-primary/20 text-primary rounded-full px-2 py-1 text-xs font-semibold">
										Author
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			<Dialog
				open={editDialog.isOpen}
				onOpenChange={(isOpen) => setEditDialog({ ...editDialog, isOpen })}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Author Name</DialogTitle>
						<DialogDescription>
							Update the name for this author.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Input
							placeholder="Author name"
							value={editDialog.name}
							onChange={(e) =>
								setEditDialog({ ...editDialog, name: e.target.value })
							}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() =>
								setEditDialog({ isOpen: false, userId: null, name: '' })
							}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateName}
							disabled={
								!editDialog.name.trim() || updateAuthorNameMutation.isPending
							}
						>
							{updateAuthorNameMutation.isPending ? 'Saving...' : 'Save'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteConfirmation.isOpen}
				onOpenChange={(isOpen) =>
					setDeleteConfirmation({ ...deleteConfirmation, isOpen })
				}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove Author Role</DialogTitle>
						<DialogDescription>
							Are you sure you want to remove the author role from this user?
							The user will revert to the "user" role. This action does NOT
							delete the user.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() =>
								setDeleteConfirmation({ isOpen: false, userId: null })
							}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Remove Author Role
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	)
}
