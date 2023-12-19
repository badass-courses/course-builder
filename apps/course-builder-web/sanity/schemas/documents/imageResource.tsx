export default {
  name: 'imageResource',
  type: 'document',
  title: 'Image Resource',
  fields: [
    {
      name: 'url',
      type: 'url',
      title: 'Image URL',
    },
    {
      name: 'alt',
      type: 'string',
      title: 'Alternative text',
    },
  ],
  preview: {
    select: {url: 'url', alt: 'alt'},
    prepare(selection: any) {
      const {url, alt} = selection
      return {media: <img src={url} alt={alt} />}
    },
  },
}
