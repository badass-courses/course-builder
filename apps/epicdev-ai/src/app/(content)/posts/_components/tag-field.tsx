import * as React from 'react'
import Link from 'next/link'
import TagCrudDialog from '@/app/admin/tags/tag-crud-dialog'
import { addTagToPost, removeTagFromPost } from '@/lib/posts-query'
import type { Tag } from '@/lib/tags'
import { api } from '@/trpc/react'
import { guid } from '@/utils/guid'
import { Pencil, Plus } from 'lucide-react'
import { z } from 'zod'

import { Button, FormDescription, FormLabel, Skeleton } from '@coursebuilder/ui'
import AdvancedTagSelector from '@coursebuilder/ui/resources-crud/tag-selector'

/**
 * A shared component for handling tag selection and management in resources.
 * Includes tag parsing, selection, and optional edit button.
 */
export interface TagFieldProps {
	/**
	 * The resource (post, list, etc) that has tags
	 */
	resource: {
		id: string
		tags?:
			| {
					contentResourceId: string
					tagId: string
					position: number
					createdAt: Date
					updatedAt: Date
					tag: {
						type: 'topic'
						createdAt: Date
						updatedAt: Date
						id: string
						fields: {
							label: string
							name: string
						}
						organizationId?: string | null
						deleteAt?: Date | null
					}
					organizationId?: string | null
			  }[]
			| null
	}
	label?: string
	showEditButton?: boolean
}

export const TagField: React.FC<TagFieldProps> = ({
	resource,
	label = 'Tags',
	showEditButton = false,
}) => {
	const utils = api.useUtils()
	const { data: tags, isLoading } = api.tags.getTags.useQuery()
	const { mutate: createTag } = api.tags.createTag.useMutation({
		onSuccess: () => {
			utils.tags.getTags.invalidate()
		},
	})

	const parsedTagsForUiPackage = z
		.array(
			z.object({
				id: z.string(),
				fields: z.object({
					label: z.string(),
					name: z.string(),
				}),
			}),
		)
		.parse(tags || [])

	const parsedSelectedTagsForUiPackage = z
		.array(
			z.object({
				tag: z.object({
					id: z.string(),
					fields: z.object({
						label: z.string(),
						name: z.string(),
					}),
				}),
			}),
		)
		.parse(resource.tags || [])

	const handleCreateTag = (tag: Tag) => {
		createTag({
			...tag,
			type: 'topic',
			id: guid(),
			createdAt: new Date(),
			updatedAt: new Date(),
		})
	}

	return (
		<div className="px-5">
			<div className="flex w-full items-baseline justify-between">
				<FormLabel className="text-lg font-semibold">{label}</FormLabel>
				{showEditButton && (
					<Button
						variant="ghost"
						size="sm"
						className="flex items-center gap-1 opacity-75 hover:opacity-100"
						asChild
					>
						<Link href="/admin/tags">
							<Pencil className="h-3 w-3" /> Edit
						</Link>
					</Button>
				)}
			</div>
			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-9 w-full" />
					<Skeleton className="h-9 w-32" />
				</div>
			) : tags?.length ? (
				<div className="space-y-2">
					<AdvancedTagSelector
						availableTags={parsedTagsForUiPackage}
						selectedTags={
							parsedSelectedTagsForUiPackage?.map((tag) => tag.tag) ?? []
						}
						onTagSelect={async (tag: { id: string }) => {
							await addTagToPost(resource.id, tag.id)
						}}
						onTagRemove={async (tagId: string) => {
							await removeTagFromPost(resource.id, tagId)
						}}
					/>
					<TagCrudDialog onSubmit={handleCreateTag}>
						<Button
							variant="secondary"
							size="sm"
							className="flex w-fit items-center gap-1"
						>
							<Plus className="h-3 w-3" /> Create Tag
						</Button>
					</TagCrudDialog>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					<FormDescription>
						No tags available. Create some tags to help organize your content.
					</FormDescription>
					<TagCrudDialog onSubmit={handleCreateTag}>
						<Button
							variant="secondary"
							size="sm"
							className="flex w-fit items-center gap-1"
						>
							<Plus className="h-3 w-3" /> Create Tag
						</Button>
					</TagCrudDialog>
				</div>
			)}
		</div>
	)
}
