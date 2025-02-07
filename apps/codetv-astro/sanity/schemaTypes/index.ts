import {defineField, defineType} from 'sanity'
import {person} from './documents/person'

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

const date = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
	timeZone: 'America/Los_Angeles',
})

export const slugField = defineField({
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

const series = defineType({
	type: 'document',
	name: 'series',
	title: 'Series',
	fields: [
		defineField({
			title: 'Series Title',
			name: 'title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		slugField,
		defineField({
			title: 'Collections',
			name: 'collections',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{type: 'collection'}],
				},
			],
		}),
		defineField({
			title: 'Series Image',
			name: 'image',
			type: 'cloudinary.asset',
		}),
		defineField({
			title: 'Series Description',
			name: 'description',
			type: 'text',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			title: 'Sponsors',
			name: 'sponsors',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{type: 'sponsor'}],
				},
			],
		}),
		defineField({
			title: 'Feature on the home page?',
			name: 'featured',
			type: 'boolean',
		}),
	],
	initialValue: () => {
		return {
			featured: false,
		}
	},
})

const collection = defineType({
	type: 'document',
	name: 'collection',
	title: 'Collection',
	fields: [
		defineField({
			title: 'Collection Title',
			name: 'title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		slugField,
		defineField({
			type: 'date',
			name: 'release_year',
			title: 'Release Year',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			title: 'Series',
			name: 'series',
			type: 'reference',
			to: {type: 'series'},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			title: 'Episodes',
			name: 'episodes',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{type: 'episode'}],
				},
			],
		}),
	],
	preview: {
		select: {
			series_title: 'series.title',
			title: 'title',
			year: 'release_year',
			episodes: 'episodes',
		},
		prepare({series_title, title, year, episodes}) {
			const episodeCount = episodes?.length ?? 0

			return {
				title: `${series_title}: ${title}`,
				subtitle: `Released ${new Date(year).getFullYear()} · ${episodeCount} episodes`,
			}
		},
	},
})

const episode = defineType({
	type: 'document',
	name: 'episode',
	title: 'Episode',
	groups: [
		{name: 'video', title: 'Video Details'},
		{name: 'seo', title: 'SEO'},
	],
	fields: [
		defineField({
			title: 'Hide on the website?',
			name: 'hidden',
			type: 'boolean',
		}),
		defineField({
			title: 'Title',
			name: 'title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		slugField,
		defineField({
			name: 'publish_date',
			type: 'datetime',
			title: 'Publish Date',
			options: {
				timeStep: 30,
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			title: 'People In This Episode',
			name: 'people',
			type: 'array',
			of: [{type: 'reference', to: [{type: 'person'}]}],
		}),
		defineField({
			title: 'Short Description',
			name: 'short_description',
			type: 'text',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			title: 'Description',
			name: 'description',
			type: 'markdown',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			title: 'Linked Resources',
			name: 'resources',
			type: 'array',
			of: [
				{
					title: 'Resource',
					name: 'resource',
					type: 'object',
					fields: [
						{title: 'Label', name: 'label', type: 'string'},
						{title: 'URL', name: 'url', type: 'url'},
					],
				},
			],
		}),
		defineField({
			title: 'Sponsors',
			name: 'sponsors',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{type: 'sponsor'}],
				},
			],
		}),
		defineField({
			title: 'Video',
			name: 'video',
			type: 'object',
			group: 'video',
			fields: [
				{
					title: 'Members-only',
					name: 'members_only',
					type: 'boolean',
				},
				{name: 'mux_video', title: 'Video File', type: 'mux.video'},
				{name: 'captions', title: 'Captions (SRT)', type: 'file', options: {accept: '.srt'}},
				{
					name: 'youtube_id',
					title: 'YouTube ID',
					description:
						'If this is supplied, the YouTube video will be displayed instead of the Mux video.',
					type: 'string',
				},
				{name: 'thumbnail', title: 'Thumbnail', type: 'cloudinary.asset'},
				{name: 'thumbnail_alt', title: 'Thumbnail Alt', type: 'string'},
				{
					name: 'transcript',
					title: 'Transcript',
					description: 'If the video was live transcribed, add it here.',
					type: 'markdown',
				},
			],
		}),
	],
	preview: {
		select: {
			title: 'title',
			publish_date: 'publish_date',
		},
		prepare({title, publish_date}) {
			return {
				title,
				subtitle: date.format(new Date(publish_date)),
			}
		},
	},
	initialValue: () => {
		return {
			hidden: false,
			video: {
				members_only: false,
			},
		}
	},
})

const sponsor = defineType({
	type: 'document',
	name: 'sponsor',
	title: 'Sponsor',
	fields: [
		defineField({
			title: 'Sponsor Name',
			name: 'title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		slugField,
		defineField({
			title: 'Logo',
			name: 'logo',
			type: 'cloudinary.asset',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			title: 'Link',
			name: 'link',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
	],
})

export const schemaTypes = [series, collection, episode, person, sponsor]
