import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { MetadataFieldDescription } from './metadata-fields/metadata-field-description'
import { MetadataFieldSlug } from './metadata-fields/metadata-field-slug'
import { MetadataFieldState } from './metadata-fields/metadata-field-state'
import { MetadataFieldTitle } from './metadata-fields/metadata-field-title'
import { MetadataFieldVisibility } from './metadata-fields/metadata-field-visibility'

export function EditResourcesMetadataFields({
	form,
	children,
}: {
	form: UseFormReturn<any>
	children?: React.ReactNode
}) {
	console.log({ form })
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
