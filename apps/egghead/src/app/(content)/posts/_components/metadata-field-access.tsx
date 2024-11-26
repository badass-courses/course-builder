import * as React from 'react'
import { PostAccessSchema } from '@/lib/posts'
import type { UseFormReturn } from 'react-hook-form'

import { ResourceVisibilitySchema } from '@coursebuilder/core/schemas/content-resource-schema'
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@coursebuilder/ui/primitives/form'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui/primitives/select'

export function MetadataFieldAccess({ form }: { form: UseFormReturn<any> }) {
	return (
		<FormField
			control={form.control}
			name="fields.access"
			render={({ field }) => (
				<FormItem className="px-5">
					<FormLabel>Access</FormLabel>
					<Select onValueChange={field.onChange} defaultValue={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Choose state" />
							</SelectTrigger>
						</FormControl>
						<SelectContent className="">
							{PostAccessSchema.options.map((option) => {
								const value = option._def.value
								return (
									<SelectItem key={value} value={value}>
										{value}
									</SelectItem>
								)
							})}
						</SelectContent>
					</Select>
					<FormDescription>
						Choose whether this post is visible to paying members only or
						everyone. Default to pro (members only).
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
