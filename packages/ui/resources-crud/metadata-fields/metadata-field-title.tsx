import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../primitives/form'
import { Input } from '../../primitives/input'

export function MetadataFieldTitle({ form }: { form: UseFormReturn<any> }) {
	return (
		<FormField
			control={form.control}
			name="fields.title"
			render={({ field }) => (
				<FormItem className="px-5">
					<FormLabel>Title</FormLabel>
					<FormDescription>
						A title should summarize the tip and explain what it is about
						clearly.
					</FormDescription>
					<Input {...field} />
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
