import * as React from 'react'
import { ResourceVisibilitySchema } from '@/lib/articles'
import type { UseFormReturn } from 'react-hook-form'

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui'

export function MetadataFieldVisibility({
	form,
}: {
	form: UseFormReturn<any>
}) {
	return (
		<FormField
			control={form.control}
			name="fields.visibility"
			render={({ field }) => (
				<FormItem className="px-5">
					<FormLabel>Visibility</FormLabel>
					<Select onValueChange={field.onChange} defaultValue={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Choose state" />
							</SelectTrigger>
						</FormControl>
						<SelectContent className="">
							{ResourceVisibilitySchema.options.map((option) => {
								const value = option._def.value
								return (
									<SelectItem key={value} value={value}>
										{value}
									</SelectItem>
								)
							})}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
