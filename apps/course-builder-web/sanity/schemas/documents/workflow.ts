import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'workflow',
  type: 'document',
  title: 'Workflow',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'trigger',
      title: 'Trigger',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'actions',
      title: 'Actions',
      type: 'array',
      of: [{type: 'prompt'}],
    }),
  ],
})
