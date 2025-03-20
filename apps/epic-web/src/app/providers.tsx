'use client'

import { useState } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { TRPCReactProvider } from '@/trpc/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						refetchOnWindowFocus: false,
						retry: false,
						staleTime: Infinity,
					},
				},
			}),
	)

	return (
		<QueryClientProvider client={queryClient}>
			<SessionProvider>
				<TRPCReactProvider>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						{children}
						<Toaster position="bottom-center" />
					</ThemeProvider>
				</TRPCReactProvider>
			</SessionProvider>
		</QueryClientProvider>
	)
}
