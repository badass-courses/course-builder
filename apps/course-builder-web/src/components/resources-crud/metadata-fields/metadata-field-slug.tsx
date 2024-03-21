import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'

export function MetadataFieldSlug({ form }: { form: UseFormReturn<any> }) {
	return (
		<FormField
			control={form.control}
			name="slug"
			render={({ field }) => (
				<FormItem className="px-5">
					<FormLabel>Slug</FormLabel>
					<Input {...field} />
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
