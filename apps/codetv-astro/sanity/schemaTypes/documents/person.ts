import {defineField, defineType} from 'sanity'

function slugify(str: string) {
	return String(str)
		.normalize('NFKD') // split accented characters into their base characters and diacritical marks
		.replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
		.trim() // trim leading or trailing whitespace
		.toLowerCase() // convert to lowercase
		.replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-') // remove consecutive hyphens
}

const slugField = defineField({
	title: 'Slug',
	name: 'slug',
	type: 'slug',
	options: {
		source: 'title',
		slugify,
		// TODO collection and episode slugs can duplicate as long as they have different parents
		isUnique: () => true,
	},
	validation: (Rule) => Rule.required(),
})

export const person = defineType({
	name: 'person',
	type: 'document',
	title: 'Person',
	fields: [
		defineField({
			title: 'Display Name',
			name: 'name',
			type: 'string',
		}),
		slugField,
		defineField({
			title: 'Profile Photo',
			name: 'photo',
			type: 'cloudinary.asset',
		}),
		defineField({
			title: 'Bio',
			name: 'bio',
			type: 'markdown',
			validation: (rule) => rule.max(750),
		}),
		defineField({
			title: 'Links',
			name: 'links',
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'link',
					fields: [
						{type: 'string', name: 'label', title: 'Label'},
						{type: 'url', name: 'url', title: 'URL'},
					],
				},
			],
		}),
		defineField({
			title: 'Subscription',
			name: 'subscription',
			type: 'object',
			fields: [
				{title: 'Stripe Customer ID', name: 'customer', type: 'string'},
				{title: 'Level', name: 'level', type: 'string'},
				{title: 'Status', name: 'status', type: 'string'},
				{title: 'Join Date', name: 'date', type: 'datetime'},
			],
			// readOnly: true,
		}),
		defineField({
			title: 'Clerk User ID',
			name: 'user_id',
			type: 'string',
			// validation: (rule) => rule.required(),
			// readOnly: true,
		}),
	],
	preview: {
		select: {
			name: 'name',
			photo: 'photo',
			subscription: 'subscription',
		},
		prepare({name, photo, subscription}) {
			const url = new URL('https://res.cloudinary.com')
			url.pathname = [
				'jlengstorf',
				'image',
				photo.type,
				't_thumb400',
				'w_99',
				'v' + photo.version,
				photo.public_id,
			].join('/')

			const subtitle = subscription?.status === 'active' ? subscription?.level : ''

			return {
				title: name,
				subtitle,
				imageUrl: url.toString(),
			}
		},
	},
})
