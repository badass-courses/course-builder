import { keyGenerator } from '@/lib/sanity-content'

import type { SanityReference } from './schemas'

export const systemFieldsProjection = `
_id,
_type,
_createdAt,
_updatedAt,
_rev
`

export function createSanityReference(documentId: string): SanityReference {
	return {
		_type: 'reference',
		_key: keyGenerator(),
		_ref: documentId,
	}
}
