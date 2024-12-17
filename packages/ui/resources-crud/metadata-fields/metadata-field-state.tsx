import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../primitives/form'
import { Input } from '../../primitives/input'

export function MetadataFieldState({ form }: { form: UseFormReturn<any> }) {
	return (
		<FormField
			control={form.control}
			name="fields.state"
			render={({ field }) => (
				<FormItem className="px-5">
					<FormLabel className="text-lg font-bold">State</FormLabel>
					<Input {...field} readOnly disabled />
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
