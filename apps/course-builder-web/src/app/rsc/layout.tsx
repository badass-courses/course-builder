import * as React from 'react'
import { AI } from '@/app/rsc/action'

export const metadata = {
  title: 'RSC Streaming Components',
  description: 'testing new stuff in ai/rsc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <AI>{children}</AI>
}
