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
		<footer className="dark w-full border-t border-[rgb(233,232,238)] bg-gradient-to-b from-slate-900 to-indigo-950 pb-10 pt-16 dark:border-[rgb(33,33,48)]">
			<div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-8 pb-56 sm:px-10">
				<Link href="/">
					<Logo className="origin-left scale-110" withSubtitle />
				</Link>
				{/* <ThemeToggle className="" /> */}
			</div>
			<p className="text-center text-xs text-violet-200 opacity-75">
				Copyright © {new Date().getFullYear()} EpicAI.pro
			</p>
		</footer>
	)
}
