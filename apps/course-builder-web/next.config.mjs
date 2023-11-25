/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.mjs')
import createMDX from '@next/mdx'

const subdomains = ['docs']

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    providerImportSource: '@mdx-js/react',
  },
})

/** @type {import("next").NextConfig} */
const config = {
  pageExtensions: ['mdx', 'ts', 'tsx'],
  transpilePackages: ['@coursebuilder/ui'],
  // @ts-expect-error
  async redirects() {
    return [
      ...subdomains.map((subdomain) => ({
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: `${subdomain}.coursebuilder.dev`,
          },
        ],
        destination: `https://www.coursebuilder.dev/${subdomain}/:path*`,
        permanent: false,
      })),
    ]
  },
}

export default withMDX(config)
