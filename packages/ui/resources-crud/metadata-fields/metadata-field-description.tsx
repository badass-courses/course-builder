import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../primitives/form'
import { Textarea } from '../../primitives/textarea'

export function MetadataFieldDescription({
	form,
}: {
	form: UseFormReturn<any>
}) {
	return (
		<FormField
			control={form.control}
			name="fields.description"
			render={({ field }) => (
				<FormItem className="px-5">
					<FormLabel className="text-lg font-bold">Short Description</FormLabel>
					<FormDescription>
						Used as a short &quot;SEO&quot; summary on Twitter cards etc.
					</FormDescription>
					<Textarea {...field} value={field.value?.toString()} />
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
