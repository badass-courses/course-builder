/** @jsxImportSource react */
import { parseAlgoliaHitSnippet } from '@algolia/autocomplete-preset-algolia'

export function Snippet({ hit, attribute }) {
	return (
		<>
			{parseAlgoliaHitSnippet({ hit, attribute }).map(
				({ value, isHighlighted }, index) =>
					isHighlighted ? <mark key={index}>{value}</mark> : value,
			)}
		</>
	)
}
