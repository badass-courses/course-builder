import {defineField, defineType} from 'sanity'

export default defineType({
    name: 'delay',
    type: 'object',
    title: 'Delay',
    fields: [
        defineField({
            name: 'duration',
            title: 'Delay Length',
            type: 'number',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'unit',
            title: 'Delay Unit',
            type: 'string',
            initialValue: 's',
            options: {
                list: [
                    {title: 'Second(s)', value: 's'},
                    {title: 'Minute(s)', value: 'm'},
                    {title: 'Day(s)', value: 'd'}
                ],
            },
        }),
    ],
    preview: {
        select: {
            duration: 'duration',
            unit: 'unit',
        },
        prepare(selection) {
            const {duration, unit} = selection
            return {
                title: `${duration}${unit}`
            }
        },
    },
})