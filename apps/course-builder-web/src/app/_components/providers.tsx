'use client'

import {SessionProvider} from 'next-auth/react'
import {MDXProvider} from '@mdx-js/react'

export function Providers({children}: {children: React.ReactNode}) {
  return (
    <MDXProvider>
      <SessionProvider>{children}</SessionProvider>
    </MDXProvider>
  )
}
