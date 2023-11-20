import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Course Builder',
      social: {
        github: 'https://github.com/joelhooks/course-builder',
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Getting Started', link: '/guides/getting-started/' },
          ],
        },
      ],
    }),
  ],
})
