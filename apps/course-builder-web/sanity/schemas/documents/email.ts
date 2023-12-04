import {LemonIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'courseBuilderEmail',
  title: 'Email',
  icon: LemonIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'subject',
      title: 'Subject',
      type: 'string',
      validation: (rule) => rule.required(),
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
      name: 'previewText',
      title: 'Preview Text',
      type: 'text',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'markdown',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
    },
    prepare({title, author}) {
      const subtitles = [author && `by ${author}`].filter(Boolean)

      return {title, subtitle: subtitles.join(' ')}
    },
  },
})
