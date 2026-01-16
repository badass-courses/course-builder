'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User } from '@/ability'
import { api } from '@/trpc/react'
import { Pencil, User as UserIcon, X } from 'lucide-react'

import {
	Button,
	FormDescription,
	FormLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
} from '@coursebuilder/ui'

/**
 * Props for the AuthorField component.
 */
export interface AuthorFieldProps {
	/**
	 * The resource (post, list, etc) that has an author
	 */
	resource: {
		id: string
		createdById: string
		author?: {
			contentResourceId: string
			userId: string
			createdAt: Date
			updatedAt: Date
			user: User
		} | null
	}
	/**
	 * Label for the field
	 */
	label?: string
	/**
	 * Show edit button linking to admin authors page
	 */
	showEditButton?: boolean
}

/**
 * Component for assigning an author to a resource.
 * Authors are users with the "author" role.
 * If no author is assigned, falls back to createdBy user.
 */
export const AuthorField: React.FC<AuthorFieldProps> = ({
	resource,
	label = 'Author',
	showEditButton = false,
}) => {
	const utils = api.useUtils()
	const { data: authors, isLoading: authorsLoading } =
		api.authors.getAuthors.useQuery()
	const { data: currentAuthor, isLoading: authorLoading } =
		api.authors.getResourceAuthor.useQuery(
			{ resourceId: resource.id },
			{
				// Use assigned author if available, otherwise fallback to createdBy
				initialData: resource.author?.user || null,
			},
		)

	const assignAuthorMutation = api.authors.assignAuthorToResource.useMutation({
		onSuccess: () => {
			utils.authors.getResourceAuthor.invalidate({ resourceId: resource.id })
		},
	})

	const removeAuthorMutation = api.authors.removeAuthorFromResource.useMutation(
		{
			onSuccess: () => {
				utils.authors.getResourceAuthor.invalidate({ resourceId: resource.id })
			},
		},
	)

	const handleAuthorChange = async (userId: string) => {
		if (userId === '') {
			// Clear assignment (fallback to createdBy)
			await removeAuthorMutation.mutateAsync({ resourceId: resource.id })
		} else {
			// Assign author
			await assignAuthorMutation.mutateAsync({
				resourceId: resource.id,
				userId,
			})
		}
	}

	const isLoading = authorsLoading || authorLoading
	const hasAssignedAuthor =
		resource.author !== null && resource.author !== undefined
	const isUsingFallback = !hasAssignedAuthor

	return (
		<div className="px-5">
			<div className="flex w-full items-baseline justify-between">
				<FormLabel className="text-lg font-bold">{label}</FormLabel>
				{showEditButton && (
					<Button
						variant="ghost"
						size="sm"
						className="flex items-center gap-1 opacity-75 hover:opacity-100"
						asChild
					>
						<Link href="/admin/authors">
							<Pencil className="h-3 w-3" /> Edit
						</Link>
					</Button>
				)}
			</div>

			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-9 w-full" />
				</div>
			) : (
				<div className="space-y-3">
					{/* Current Author Display */}
					{currentAuthor && (
						<div className="flex items-center gap-3 rounded-lg border p-3">
							{currentAuthor.image ? (
								<Image
									src={currentAuthor.image}
									alt={currentAuthor.name || 'Author'}
									width={40}
									height={40}
									className="rounded-full object-cover"
								/>
							) : (
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
									<UserIcon className="h-5 w-5 text-gray-500" />
								</div>
							)}
							<div className="flex-1">
								<p className="font-medium">{currentAuthor.name || 'No name'}</p>
								<p className="text-sm text-gray-500">{currentAuthor.email}</p>
								{isUsingFallback && (
									<p className="text-xs text-gray-400">
										(Using createdBy - no author assigned)
									</p>
								)}
							</div>
							{hasAssignedAuthor && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleAuthorChange('')}
									title="Remove author assignment (fallback to createdBy)"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					)}

					{/* Author Selector */}
					{authors && authors.length > 0 ? (
						<Select
							value={hasAssignedAuthor ? resource.author?.userId : ''}
							onValueChange={handleAuthorChange}
							disabled={
								assignAuthorMutation.isPending || removeAuthorMutation.isPending
							}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={
										hasAssignedAuthor
											? 'Change author...'
											: 'Assign author (or use createdBy)...'
									}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">Use createdBy (default)</SelectItem>
								{authors.map((author) => (
									<SelectItem key={author.id} value={author.id}>
										{author.name || author.email}
										{author.email && author.name && ` (${author.email})`}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<div className="flex flex-col gap-2">
							<FormDescription>
								No authors available. Assign the "author" role to users in the{' '}
								<Link href="/admin/authors" className="text-primary underline">
									Authors
								</Link>{' '}
								page. The resource will use the createdBy user by default.
							</FormDescription>
						</div>
					)}

					{isUsingFallback && (
						<FormDescription className="text-xs">
							Currently using createdBy user. Select an author above to assign a
							specific author.
						</FormDescription>
					)}
				</div>
			)}
		</div>
	)
}
