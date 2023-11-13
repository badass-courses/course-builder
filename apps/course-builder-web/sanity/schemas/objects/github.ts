export default {
  name: 'github',
  type: 'object',
  title: 'GitHub',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'repo',
      title: 'Repository URL',
      type: 'string',
      description: 'The GitHub repository URL',
    },
  ],
}
