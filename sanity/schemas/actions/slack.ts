import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'slack',
  type: 'object',
  title: 'Slack',
  fields: [
    defineField({
      name: 'channel',
      title: 'Notify Channel',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      channel: 'channel',
    },
    prepare(selection) {
      const {channel} = selection
      return {
        title: `Slack Message in ${channel}`,
      }
    },
  },
})
