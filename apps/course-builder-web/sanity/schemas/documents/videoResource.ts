/* eslint-disable import/no-anonymous-default-export */
import {MdVideocam} from 'react-icons/md'
import {defineField} from 'sanity'

export default {
  name: 'videoResource',
  title: 'Video Resource',
  type: 'document',
  icon: MdVideocam,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      readOnly: true,
    },
    defineField({
      name: 'state',
      title: 'Current State',
      type: 'string',
      validation: (Rule) => Rule.required(),
      initialValue: 'new',
      options: {
        list: [
          {title: 'new', value: 'new'},
          {title: 'processing', value: 'processing'},
          {title: 'preparing', value: 'preparing'},
          {title: 'ready', value: 'ready'},
          {title: 'errored', value: 'errored'},
        ],
      },
      readOnly: true,
    }),
    {
      name: 'originalMediaUrl',
      title: 'Original Media Url',
      description: 'A URL to the source video on the Internet',
      type: 'url',
      readOnly: true,
    },
    {
      name: 'duration',
      title: 'Duration',
      type: 'number',
      readOnly: true,
    },
    {
      name: 'muxPlaybackId',
      title: 'Mux Playback ID',
      description: 'Hashed ID of a video on mux',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'muxAssetId',
      title: 'Mux Asset ID',
      description: 'ID that references the asset in Mux.',
      type: 'string',
      readOnly: true,
    },
    defineField({
      name: 'transcript',
      title: 'Transcript Text',
      type: 'text',
    }),
    defineField({
      title: 'SRT',
      name: 'srt',
      type: 'text',
    }),
  ],
}
