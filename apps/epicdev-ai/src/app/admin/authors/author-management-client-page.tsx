'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import { User } from '@/ability'
import { env } from '@/env.mjs'
import { createImageResource } from '@/lib/image-resource-query'
import { api } from '@/trpc/react'
import { Pencil, Plus, Search, Trash2, User as UserIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	ScrollArea,
} from '@coursebuilder/ui'

import AuthorCrudDialog from './author-crud-dialog'

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
 * Component for selecting an image from uploaded images
 */
function ImageSelector({
	selectedImage,
	onSelectImage,
}: {
	selectedImage: string | null
	onSelectImage: (url: string) => void
}) {
	const { data } = api.imageResources.getAll.useQuery()
	const images: Array<{ id: string; url: string; alt?: string | null }> =
		data ?? []

	return (
		<div className="grid grid-cols-3 gap-2">
			{images.length > 0 ? (
				images.map((asset) => {
					if (!asset?.url) return null
					const imageUrl = asset.url.replace('http://', 'https://')
					return (
						<div
							key={asset.id}
							className={`relative cursor-pointer rounded border-2 transition ${
								selectedImage === imageUrl
									? 'border-primary'
									: 'border-transparent hover:border-gray-300'
							}`}
							onClick={() => onSelectImage(imageUrl)}
						>
							<Image
								src={imageUrl}
								alt={asset.id}
								width={200}
								height={200}
								className="aspect-square w-full rounded object-cover"
							/>
						</div>
					)
				})
			) : (
				<div className="col-span-3 py-4 text-center text-sm text-gray-500">
					No images uploaded yet. Upload images using the button below.
				</div>
			)}
		</div>
	)
}

function CloudinaryUploadButtonWithCallback({
	dir,
	id,
	onImageUploaded,
}: {
	dir: string
	id: string
	onImageUploaded: (url: string) => void
}) {
	const session = useSession()
	const cloudinaryRef = useRef<any>(undefined)
	const widgetRef = useRef<any>(undefined)

	useEffect(() => {
		if ((window as any).cloudinary) {
			cloudinaryRef.current = (window as any).cloudinary
		}
	}, [])

	return session?.data?.user ? (
		<div>
			<Script
				strategy="afterInteractive"
				onLoad={() => {
					cloudinaryRef.current = (window as any).cloudinary
				}}
				src="https://upload-widget.cloudinary.com/global/all.js"
				type="text/javascript"
			/>
			<Button
				type="button"
				variant="outline"
				className="flex w-full"
				onClick={() => {
					if (!cloudinaryRef.current) {
						console.error('Cloudinary widget not loaded yet')
						alert(
							'Cloudinary widget is still loading. Please wait a moment and try again.',
						)
						return
					}

					if (!widgetRef.current) {
						widgetRef.current = cloudinaryRef.current.createUploadWidget(
							{
								cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
								uploadPreset: env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
								folder: `${dir}/${id}`,
							},
							(error: any, result: any) => {
								if (!error && result && result.event === 'success') {
									console.debug('Image uploaded:', result.info)
									createImageResource({
										asset_id: result.info.asset_id,
										secure_url: result.info.secure_url,
									}).then(() => {
										onImageUploaded(result.info.secure_url)
									})
								} else if (error) {
									console.error('Cloudinary upload error:', error)
								}
							},
						)
					}
					widgetRef.current.open()
				}}
			>
				Upload Image
			</Button>
		</div>
	) : null
}

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
		image: string | null
	}>({ isOpen: false, userId: null, name: '', image: null })

	const utils = api.useUtils()
	const { data: authorsData, refetch } = api.authors.getAuthors.useQuery(
		undefined,
		{
			initialData: initialAuthors,
		},
	)

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
			setEditDialog({ isOpen: false, userId: null, name: '', image: null })
		},
	})

	const updateAuthorImageMutation = api.authors.updateAuthorImage.useMutation({
		onSuccess: async () => {
			await utils.authors.getAuthors.invalidate()
			await refetch()
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
			image: author.image || null,
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

	const handleUpdateImage = async () => {
		if (editDialog.userId) {
			await updateAuthorImageMutation.mutateAsync({
				userId: editDialog.userId,
				image: editDialog.image || null,
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
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>Edit Author</DialogTitle>
						<DialogDescription>
							Update the name and image for this author.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div>
							<label className="mb-2 block text-sm font-medium">Name</label>
							<Input
								placeholder="Author name"
								value={editDialog.name}
								onChange={(e) =>
									setEditDialog({ ...editDialog, name: e.target.value })
								}
							/>
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium">
								Image URL
							</label>
							<Input
								placeholder="https://example.com/image.png"
								value={editDialog.image || ''}
								onChange={async (e) => {
									const newImage = e.target.value || null
									setEditDialog({ ...editDialog, image: newImage })
									if (editDialog.userId) {
										try {
											await updateAuthorImageMutation.mutateAsync({
												userId: editDialog.userId,
												image: newImage,
											})
										} catch (error) {
											console.error('Failed to save image:', error)
										}
									}
								}}
								onDrop={async (e) => {
									e.preventDefault()
									const result = e.dataTransfer.getData('text/plain')
									const urlMatch = result.match(/\(([^)]+)\)/) || [null, result]
									if (urlMatch[1]) {
										const newImage = urlMatch[1]
										setEditDialog({ ...editDialog, image: newImage })
										if (editDialog.userId) {
											try {
												await updateAuthorImageMutation.mutateAsync({
													userId: editDialog.userId,
													image: newImage,
												})
											} catch (error) {
												console.error('Failed to save image:', error)
											}
										}
									}
								}}
								onDragOver={(e) => e.preventDefault()}
							/>
							{editDialog.image && (
								<div className="mt-2">
									<Image
										src={editDialog.image}
										alt="Preview"
										width={80}
										height={80}
										className="h-20 w-20 rounded-full object-cover"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium">
								Select from Uploaded Images
							</label>
							<ScrollArea className="h-48 rounded-md border p-4">
								<ImageSelector
									selectedImage={editDialog.image}
									onSelectImage={async (url) => {
										setEditDialog({ ...editDialog, image: url })
										if (editDialog.userId) {
											try {
												await updateAuthorImageMutation.mutateAsync({
													userId: editDialog.userId,
													image: url,
												})
											} catch (error) {
												console.error('Failed to save image:', error)
											}
										}
									}}
								/>
							</ScrollArea>
							{editDialog.userId && (
								<div className="mt-2">
									<CloudinaryUploadButtonWithCallback
										dir="authors"
										id={editDialog.userId}
										onImageUploaded={async (url) => {
											setEditDialog({ ...editDialog, image: url })
											try {
												await updateAuthorImageMutation.mutateAsync({
													userId: editDialog.userId!,
													image: url,
												})
											} catch (error) {
												console.error('Failed to save image:', error)
											}
										}}
									/>
								</div>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() =>
								setEditDialog({
									isOpen: false,
									userId: null,
									name: '',
									image: null,
								})
							}
						>
							Cancel
						</Button>
						<div className="flex gap-2">
							<Button
								onClick={handleUpdateName}
								disabled={
									!editDialog.name.trim() || updateAuthorNameMutation.isPending
								}
								variant="outline"
							>
								{updateAuthorNameMutation.isPending ? 'Saving...' : 'Save Name'}
							</Button>
							<Button
								onClick={handleUpdateImage}
								disabled={updateAuthorImageMutation.isPending}
								variant="outline"
							>
								{updateAuthorImageMutation.isPending
									? 'Saving...'
									: 'Save Image'}
							</Button>
							<Button
								onClick={async () => {
									await Promise.all([handleUpdateName(), handleUpdateImage()])
								}}
								disabled={
									!editDialog.name.trim() ||
									updateAuthorNameMutation.isPending ||
									updateAuthorImageMutation.isPending
								}
							>
								{updateAuthorNameMutation.isPending ||
								updateAuthorImageMutation.isPending
									? 'Saving...'
									: 'Save All'}
							</Button>
						</div>
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
