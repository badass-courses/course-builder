/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/pages/studio/[[...index]].tsx` route
 */

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { unsplashImageAsset } from 'sanity-plugin-asset-source-unsplash'
import { previewUrl } from 'sanity-plugin-iframe-pane/preview-url'
import { markdownSchema } from 'sanity-plugin-markdown'
import { deskTool } from 'sanity/desk'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId } from './sanity/env'
import { DRAFT_MODE_ROUTE, previewSecretId } from './sanity/lib/sanity.api'
import { previewDocumentNode } from './sanity/plugins/previewPane'
import { settingsPlugin, settingsStructure } from './sanity/plugins/settings'
import { schema } from './sanity/schema'
import postType from './sanity/schemas/documents//post'
import authorType from './sanity/schemas/documents/author'
import settingsType from './sanity/schemas/settings'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'Media Processor',
  schema,
  plugins: [
    deskTool({
      structure: settingsStructure(settingsType),
      // `defaultDocumentNode` is responsible for adding a “Preview” tab to the document pane
      defaultDocumentNode: previewDocumentNode(),
    }),
    // Configures the global "new document" button, and document actions, to suit the Settings document singleton
    settingsPlugin({ type: settingsType.name }),
    // Add the "Open preview" action
    previewUrl({
      base: DRAFT_MODE_ROUTE,
      urlSecretId: previewSecretId,
      matchTypes: [postType.name, settingsType.name],
    }),
    // Add an image asset source for Unsplash
    unsplashImageAsset(),
    // Vision lets you query your content with GROQ in the studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({ defaultApiVersion: apiVersion }),
    markdownSchema(),
  ],
})
