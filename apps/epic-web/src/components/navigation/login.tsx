'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'
import { useSession } from 'next-auth/react'

export function Login({ className }: { className?: string }) {
	const pathname = usePathname()
	const { data: sessionData, status: sessionStatus } = useSession()
	const isLoadingUserInfo = sessionStatus === 'loading'

	// Don't render anything during initial load to prevent flash
	if (isLoadingUserInfo) {
		return null
	}

	// Only show login button if user is not logged in
	if (sessionData?.user?.email) {
		return null
	}

	return (
		<Link
			href="/login"
			className={cn(
				'group flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition hover:opacity-100',
				{
					'underline opacity-100': pathname === '/login',
					'opacity-75': pathname !== '/login',
				},
				className,
			)}
		>
			Log in
		</Link>
	)
}
