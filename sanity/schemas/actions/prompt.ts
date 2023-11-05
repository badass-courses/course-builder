import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'prompt',
  type: 'object',
  title: 'GPT Prompt',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'model',
      title: 'Model to Use',
      type: 'string',
      initialValue: 'gpt-4',
      options: {
        list: [
          {title: 'gpt-4', value: 'gpt-4'},
          {title: 'gpt-3.5', value: 'gpt-3.5'}
        ],
      },

      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      initialValue: 'user',
      options: {
        list: [
          {title: 'User', value: 'user'},
          {title: 'System', value: 'system'},
          {title: 'Assistant', value: 'assistant'}
        ],
      },

      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'The name of the prompter to use',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'markdown',
      description: 'The content of the prompt as markdown with liquid templating',
      validation: (Rule) => Rule.required(),
    }),
  ],
})