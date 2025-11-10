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
import { cn } from '../../utils/cn'

export function MetadataFieldVisibility({
	form,
	className,
	name = 'fields.visibility',
}: {
	form: UseFormReturn<any>
	className?: string
	name?: string
}) {
	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn('px-5', className)}>
					<FormLabel className="text-lg font-bold">Visibility</FormLabel>
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
