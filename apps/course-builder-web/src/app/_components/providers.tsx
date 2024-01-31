'use client'

import { MDXProvider } from '@mdx-js/react'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MDXProvider>
      <SessionProvider>{children}</SessionProvider>
    </MDXProvider>
  )
}
