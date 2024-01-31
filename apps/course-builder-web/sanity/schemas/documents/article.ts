import {MdArticle} from 'react-icons/md'
import {defineField} from 'sanity'

export default {
  name: 'article',
  type: 'document',
  title: 'Article',
  icon: MdArticle,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'state',
      title: 'Current State',
      type: 'string',
      validation: (Rule) => Rule.required(),
      initialValue: 'draft',
      options: {
        list: [
          {title: 'draft', value: 'draft'},
          {title: 'published', value: 'published'},
          {title: 'archived', value: 'archived'},
          {title: 'deleted', value: 'deleted'},
        ],
      },
    }),
    defineField({
      name: 'visibility',
      title: 'Visibility',
      type: 'string',
      validation: (Rule) => Rule.required(),
      initialValue: 'public',
      options: {
        list: [
          {title: 'public', value: 'public'},
          {title: 'private', value: 'private'},
          {title: 'unlisted', value: 'unlisted'},
        ],
      },
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      validation: (Rule) => Rule.required(),
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    {
      name: 'body',
      title: 'Body',
      type: 'markdown',
    },
    {
      name: 'concepts',
      title: 'Concepts',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'concept'}],
        },
      ],
    },
    defineField({
      name: 'description',
      title: 'Short Description',
      description: 'Used as a short "SEO" summary on Twitter cards etc.',
      type: 'text',
      validation: (Rule) => Rule.max(160),
    }),
  ],
}
