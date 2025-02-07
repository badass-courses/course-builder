/** @jsxImportSource react */
import { Fragment } from 'react'
import { parseAlgoliaHitHighlight } from '@algolia/autocomplete-preset-algolia'

export function Highlight({ hit, attribute }) {
	return (
		<>
			{parseAlgoliaHitHighlight({
				hit,
				attribute,
			}).map(({ value, isHighlighted }, index) => {
				if (isHighlighted) {
					return <mark key={index}>{value}</mark>
				}

				return <Fragment key={index}>{value}</Fragment>
			})}
		</>
	)
}
