'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Logo, LogoMark } from '../brand/logo'
import { ThemeToggle } from './theme-toggle'

export default function Footer() {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')

	if (isEditRoute) {
		return null
	}

	return (
		<footer className="bg-muted mt-10 w-full border-t border-[rgb(233,232,238)] dark:border-[rgb(33,33,48)]">
			<div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-8 pb-24 pt-10 sm:px-10">
				<Link href="/">
					<Logo withSubtitle />
				</Link>
				<ThemeToggle className="" />
			</div>
		</footer>
	)
}
