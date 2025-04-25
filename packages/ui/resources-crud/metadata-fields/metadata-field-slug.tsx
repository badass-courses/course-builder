import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../primitives/form'
import { Input } from '../../primitives/input'

export function MetadataFieldSlug({ form }: { form: UseFormReturn<any> }) {
	return (
		<FormField
			control={form.control}
			name="fields.slug"
			render={({ field }) => (
				<FormItem className="px-5">
					<FormLabel className="text-lg font-bold">Slug</FormLabel>
					<Input {...field} />
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
