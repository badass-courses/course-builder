import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../primitives/form'
import { Input } from '../../primitives/input'
import { cn } from '../../utils/cn'

export function MetadataFieldState({
	form,
	name = 'fields.state',
	className,
}: {
	form: UseFormReturn<any>
	name?: string
	className?: string
}) {
	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn('px-5', className)}>
					<FormLabel className="text-lg font-bold">State</FormLabel>
					<Input {...field} readOnly disabled />
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
