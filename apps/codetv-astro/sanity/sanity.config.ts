// @ts-nocheck
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {markdownSchema} from 'sanity-plugin-markdown'
import {cloudinarySchemaPlugin} from 'sanity-plugin-cloudinary'
import {muxInput} from 'sanity-plugin-mux-input'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
	name: 'default',
	title: 'learnwithjason.dev',

	projectId: 'vnkupgyb',
	dataset: 'develop',

	plugins: [
		structureTool({
			structure: (S) => {
				return S.list()
					.title('Content')
					.items([
						...S.documentTypeListItems().filter(
							(li) => !['Episode', 'Collection'].includes(li.getTitle() ?? ''),
						),
					])
			},
		}),
		visionTool(),
		markdownSchema(),
		cloudinarySchemaPlugin(),
		muxInput(),
	],

	schema: {
		types: schemaTypes,
	},
})
