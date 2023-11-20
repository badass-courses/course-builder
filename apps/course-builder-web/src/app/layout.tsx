import '@/styles/globals.css'

import {Inter} from 'next/font/google'
import {headers} from 'next/headers'

import {TRPCReactProvider} from '@/trpc/react'

import {NextSSRPlugin} from '@uploadthing/react/next-ssr-plugin'
import {extractRouterConfig} from 'uploadthing/server'

import {ourFileRouter} from '@/app/api/uploadthing/core'
import Navigation from '@/components/navigation'
import {Providers} from '@/app/_components/providers'
import {Party} from '@/app/tips/_components/party'
import * as React from 'react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata = {
  title: 'Course Builder POC',
  description: 'Course building workflows in the cloud 🌦️',
  icons: [{rel: 'icon', url: '/favicon.ico'}],
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <Providers>
      <html lang="en">
        <body className={`font-sans ${inter.variable}`}>
          <TRPCReactProvider headers={headers()}>
            <Party />
            <div key="1" className="flex min-h-screen w-full flex-col">
              <Navigation />
              <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-row gap-4 p-4 md:gap-8 md:p-10">
                <NextSSRPlugin
                  /**
                   * The `extractRouterConfig` will extract **only** the route configs
                   * from the router to prevent additional information from being
                   * leaked to the client. The data passed to the client is the same
                   * as if you were to fetch `/api/uploadthing` directly.
                   */
                  routerConfig={extractRouterConfig(ourFileRouter)}
                />
                {children}
              </main>
            </div>
          </TRPCReactProvider>
        </body>
      </html>
    </Providers>
  )
}
