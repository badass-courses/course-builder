import * as React from 'react'
import { getOGImageUrlForResourceAPI } from '@/utils/get-og-image-url-for-resource'
import type { UseFormReturn } from 'react-hook-form'

import { Button } from '@coursebuilder/ui/primitives/button'
import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from '@coursebuilder/ui/primitives/form'
import { Input } from '@coursebuilder/ui/primitives/input'
import { Label } from '@coursebuilder/ui/primitives/label'

/**
 * Renders a form field for editing the social image metadata, with an optional editable input for custom URL.
 * @param {UseFormReturn<any>} form - The form instance from react-hook-form.
 * @param {OgImageResource} post - Resource with id, updatedAt, optional slug
 * @param {boolean} [hidden=true] - Whether the custom input should be hidden by default.
 */
type OgImageResource = {
	id: string
	updatedAt?: Date | string | null
	fields?: { slug?: string | null } | null
}
export function MetadataFieldogImage({
	form,
	post,
	hidden = true,
}: {
	form: UseFormReturn<any>
	post: OgImageResource
	hidden?: boolean
}) {
	const [isEditing, setIsEditing] = React.useState(false) // Toggle for showing input

	const customOgImage = form.watch('fields.ogImage')
	const trimmedCustom =
		typeof customOgImage === 'string' ? customOgImage.trim() : customOgImage
	const currentOgImage =
		trimmedCustom ||
		getOGImageUrlForResourceAPI({
			id: post.id,
			fields: {
				slug: form.watch('fields.slug') || post.fields?.slug || post.id,
			},
			updatedAt: post.updatedAt,
		})

	return (
		<FormField
			control={form.control}
			name="fields.ogImage"
			render={({ field }) => (
				<FormItem className="px-5">
					<FormLabel className="text-lg font-bold">Social Image</FormLabel>
					<FormDescription>
						Used as a preview image on Twitter cards etc.
					</FormDescription>
					{currentOgImage && (
						<img
							src={currentOgImage}
							alt={'social image preview'}
							width={1200 / 2}
							height={630 / 2}
							className="aspect-1200/630 w-full rounded-md border"
						/>
					)}
					<div className="mt-2 flex flex-col gap-2">
						<div className="flex items-center gap-2">
							{field.value && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										form.setValue('fields.ogImage', null)
									}}
								>
									Remove Custom Image
								</Button>
							)}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setIsEditing(!isEditing)}
							>
								{isEditing ? 'Hide' : 'Edit Custom URL'}
							</Button>
						</div>
						{isEditing && (
							<>
								<Label htmlFor={field.name}>OG Image URL</Label>
								<Input
									id={field.name}
									{...field}
									value={field.value?.toString() || ''}
									type="text"
									placeholder="Enter custom OG image URL (optional)"
								/>
							</>
						)}
					</div>
				</FormItem>
			)}
		/>
	)
}
