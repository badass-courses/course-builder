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

	return (
		<>
			{isLoadingUserInfo || sessionData?.user?.email ? null : (
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
			)}
		</>
	)
}
