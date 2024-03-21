import * as React from 'react'
import Image from 'next/image'
import type { UseFormReturn } from 'react-hook-form'

import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	Input,
} from '@coursebuilder/ui'

export function MetadataFieldSocialImage({
	form,
	currentSocialImage,
}: {
	form: UseFormReturn<any>
	currentSocialImage: string | null | undefined
}) {
	return (
		<FormField
			control={form.control}
			name="socialImage"
			render={({ field }) => (
				<FormItem className="px-5">
					<FormLabel>Social Image</FormLabel>
					<FormDescription>
						Used as a preview image on Twitter cards etc.
					</FormDescription>
					{currentSocialImage && (
						<Image
							src={currentSocialImage.toString()}
							alt={'social image preview'}
							width={1200 / 2}
							height={630 / 2}
							className="aspect-[1200/630] w-full rounded-md border"
						/>
					)}
					<div className="flex items-center gap-1">
						<Input {...field} value={field.value?.toString()} type="hidden" />
					</div>
				</FormItem>
			)}
		/>
	)
}
