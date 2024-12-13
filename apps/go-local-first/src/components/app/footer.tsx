'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogoMark } from '../logo'

export default function Footer() {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const isFullWidth = isEditRoute || pathname.includes('/admin')

	if (isFullWidth) return null

	return (
		<footer className="w-full pb-16 pt-20">
			<div className="container flex w-full items-center justify-center sm:justify-between">
				<Link
					tabIndex={isRoot ? -1 : 0}
					href="/"
					className="font-heading flex items-center justify-center gap-2 font-semibold leading-none saturate-0"
				>
					<LogoMark className="h-16 w-16" />
					{/* <span className="text-muted-foreground text-3xl font-bold !leading-none">
						{env.NEXT_PUBLIC_SITE_TITLE
					</span> */}
				</Link>
			</div>
			<div className="container mt-16 flex w-full items-center justify-center gap-5 font-sans text-sm font-light sm:justify-start">
				<span className="opacity-75">© golocalfirst.dev</span>
				<Link
					className="opacity-75 transition hover:opacity-100"
					href="/privacy"
				>
					Terms & Conditions
				</Link>
			</div>
		</footer>
	)
}
