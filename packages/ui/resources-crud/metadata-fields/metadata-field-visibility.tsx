import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { ResourceVisibilitySchema } from '@coursebuilder/core/schemas/content-resource-schema'

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../primitives/form'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../primitives/select'

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
