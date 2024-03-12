import * as React from 'react'
import { MetadataFieldDescription } from '@/components/resources-crud/metadata-fields/metadata-field-description'
import { MetadataFieldSlug } from '@/components/resources-crud/metadata-fields/metadata-field-slug'
import { MetadataFieldState } from '@/components/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldTitle } from '@/components/resources-crud/metadata-fields/metadata-field-title'
import { MetadataFieldVisibility } from '@/components/resources-crud/metadata-fields/metadata-field-visibility'
import type { UseFormReturn } from 'react-hook-form'

export function EditResourcesMetadataFields({
  form,
  children,
}: {
  form: UseFormReturn<any>
  children?: React.ReactNode
}) {
  return (
    <>
      <MetadataFieldTitle form={form} />
      <MetadataFieldSlug form={form} />
      <MetadataFieldVisibility form={form} />
      <MetadataFieldState form={form} />
      <MetadataFieldDescription form={form} />
      {children}
    </>
  )
}
