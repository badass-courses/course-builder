/* eslint-disable import/no-anonymous-default-export */
import {MdMap} from 'react-icons/md'

export default {
  name: 'concept',
  title: 'Concept',
  type: 'document',
  icon: MdMap,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    },
    {
      name: 'body',
      title: 'Body',
      type: 'markdown',
    },
  ],
}
