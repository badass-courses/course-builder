import { docsSchema, i18nSchema } from '@astrojs/starlight/schema'
import { defineCollection, type SchemaContext } from 'astro:content'
import { z } from 'astro/zod'

const DocsSchema = docsSchema()

const extendDocsSchema = () => (context: SchemaContext) =>
  DocsSchema(context).merge(
    z.object({
      ogImageUrl: z.string().url().optional(),
    }),
  )

export const collections = {
  docs: defineCollection({ schema: extendDocsSchema() }),
  i18n: defineCollection({ type: 'data', schema: i18nSchema() }),
}
