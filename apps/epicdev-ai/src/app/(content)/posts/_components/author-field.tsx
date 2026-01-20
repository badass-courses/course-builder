'use client'

import * as React from 'react'
import Link from 'next/link'
import { User } from '@/ability'
import { api } from '@/trpc/react'
import { Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

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
		fields?: {
			authorId?: string | null
			[key: string]: any
		}
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
	const { data: kentUser, isLoading: kentLoading } =
		api.authors.getKentUser.useQuery()

	const resourceAuthorId = (resource.fields as any)?.authorId || null

	const { data: dbAssignedAuthorId, isLoading: assignedAuthorIdLoading } =
		api.authors.getAssignedAuthorId.useQuery(
			{ resourceId: resource.id },
			{
				initialData: resourceAuthorId,
				refetchOnMount: false,
				refetchOnWindowFocus: false,
			},
		)
	const { data: currentAuthor, isLoading: authorLoading } =
		api.authors.getResourceAuthor.useQuery(
			{ resourceId: resource.id },
			{
				initialData: resource.author?.user || null,
			},
		)

	const assignAuthorMutation = api.authors.assignAuthorToResource.useMutation({
		onSuccess: async () => {
			await utils.authors.getAssignedAuthorId.invalidate({
				resourceId: resource.id,
			})
		},
		onError: (error) => {
			let errorMessage = 'Failed to assign author'
			if (error instanceof Error) {
				errorMessage = error.message
			} else if (typeof error === 'object' && error !== null) {
				const err = error as any
				if (err.message) {
					errorMessage = err.message
				} else if (err.data?.zodError?.formErrors?.[0]) {
					errorMessage = err.data.zodError.formErrors[0]
				}
			}
			toast.error(errorMessage, {
				icon: '⛔️',
			})
		},
	})

	const removeAuthorMutation = api.authors.removeAuthorFromResource.useMutation(
		{
			onSuccess: async () => {
				await utils.authors.getAssignedAuthorId.invalidate({
					resourceId: resource.id,
				})
				setSelectedValue(kentAuthor?.id || USE_CREATED_BY_VALUE)
			},
			onError: (error) => {
				let errorMessage = 'Failed to remove author'
				if (error instanceof Error) {
					errorMessage = error.message
				} else if (typeof error === 'object' && error !== null) {
					const err = error as any
					if (err.message) {
						errorMessage = err.message
					} else if (err.data?.zodError?.formErrors?.[0]) {
						errorMessage = err.data.zodError.formErrors[0]
					}
				}
				toast.error(errorMessage, {
					icon: '⛔️',
				})
			},
		},
	)

	const USE_CREATED_BY_VALUE = '__use_created_by__'

	const isLoading =
		authorsLoading || authorLoading || kentLoading || assignedAuthorIdLoading

	const kentAuthor = kentUser

	const otherAuthors =
		authors?.filter((author) => author.id !== kentAuthor?.id) || []

	const assignedAuthorId = resourceAuthorId || dbAssignedAuthorId || null

	const [selectedValue, setSelectedValue] = React.useState<string | null>(
		() => {
			return resourceAuthorId || null
		},
	)

	React.useEffect(() => {
		if (assignedAuthorId) {
			setSelectedValue(assignedAuthorId)
		} else if (!assignedAuthorIdLoading && !isLoading) {
			setSelectedValue(kentAuthor?.id || USE_CREATED_BY_VALUE)
		}
	}, [
		assignedAuthorId,
		assignedAuthorIdLoading,
		isLoading,
		kentAuthor?.id,
		resourceAuthorId,
	])

	const handleAuthorChange = async (userId: string) => {
		setSelectedValue(userId)

		try {
			if (userId === USE_CREATED_BY_VALUE) {
				await removeAuthorMutation.mutateAsync({ resourceId: resource.id })
			} else {
				await assignAuthorMutation.mutateAsync({
					resourceId: resource.id,
					userId,
				})
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to assign author. Please try again.'
			toast.error(errorMessage, {
				icon: '⛔️',
			})
			// Revert the selected value on error
			const currentAssignedId =
				assignedAuthorId || kentAuthor?.id || USE_CREATED_BY_VALUE
			setSelectedValue(currentAssignedId)
		}
	}

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
					{/* Author Selector */}
					{(authors && authors.length > 0) || kentAuthor ? (
						<Select
							value={selectedValue || undefined}
							onValueChange={handleAuthorChange}
							disabled={
								assignAuthorMutation.isPending || removeAuthorMutation.isPending
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select author..." />
							</SelectTrigger>
							<SelectContent>
								{/* Kent C Dodds first (ALWAYS the default) */}
								{kentAuthor && (
									<SelectItem value={kentAuthor.id}>
										{kentAuthor.name || kentAuthor.email}
										{kentAuthor.email &&
											kentAuthor.name &&
											` (${kentAuthor.email})`}{' '}
										<span className="text-muted-foreground text-xs">
											(default)
										</span>
									</SelectItem>
								)}
								{/* Use createdBy option */}
								<SelectItem value={USE_CREATED_BY_VALUE}>
									Use createdBy
								</SelectItem>
								{/* Other authors */}
								{otherAuthors.map((author) => (
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
								No authors available. Kent C. Dodds will be assigned as the
								default author.
							</FormDescription>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
