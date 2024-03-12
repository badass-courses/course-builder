import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { FormField, FormItem, FormLabel, FormMessage, Input } from '@coursebuilder/ui'

export function MetadataFieldState({ form }: { form: UseFormReturn<any> }) {
  return (
    <FormField
      control={form.control}
      name="state"
      render={({ field }) => (
        <FormItem className="px-5">
          <FormLabel>State</FormLabel>
          <Input {...field} readOnly disabled />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
