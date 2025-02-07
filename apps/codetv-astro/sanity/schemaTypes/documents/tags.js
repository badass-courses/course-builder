export default {
	name: 'episodeTag',
	type: 'document',
	title: 'Tags',
	fields: [
		{
			name: 'label',
			type: 'string',
		},
		{
			name: 'slug',
			type: 'slug',
			description: 'Used in URLs. Only lowercase letters, numbers, and hyphens.',
			options: {
				maxLength: 96,
			},
		},
		{
			name: 'description',
			type: 'text',
			title: 'Description',
			description:
				'[optional] Describe the tag. Used on the tag listing page and in search results.',
		},
	],
}
