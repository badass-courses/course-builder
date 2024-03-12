/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import createMDX from '@next/mdx'
import { withAxiom } from 'next-axiom'

await import('./src/env.mjs')

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
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.mux.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'neatly-diverse-goldfish.ngrok-free.app',
        port: '',
      },
    ],
  },
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

export default withAxiom(withMDX(config))
