import {defineField, defineType} from 'sanity'

export default defineType({
    name: 'filter',
    type: 'object',
    title: 'Filter',
    fields: [
        defineField({
            name: 'field',
            title: 'Filed to Filter On',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'value',
            title: 'Value to Filter For',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
    ],
    preview: {
        select: {
            field: 'field',
            value: 'value',
        },
        prepare(selection) {
            const {field, value} = selection
            return {
                title: `${field} to equal ${value}`
            }
        },
    },
})