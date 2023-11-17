import {MdOutlineGroupWork} from 'react-icons/md'
import {defineField} from 'sanity'

export default {
  name: 'section',
  type: 'document',
  title: 'Workshop Section',
  description: 'A named group of resources within a module.',
  icon: MdOutlineGroupWork,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.max(90),
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
      name: 'resources',
      title: 'Resources',
      type: 'array',
      description: 'Exercises, Explainers, or Link Resources in the Section',
      of: [
        {
          type: 'reference',
          to: [{type: 'exercise'}, {type: 'explainer'}, {type: 'linkResource'}],
        },
      ],
    },
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
