'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Logo, LogoMark } from '../brand/logo'
import { ThemeToggle } from './theme-toggle'
import { useNavLinks } from './use-nav-links'

export default function Footer() {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const links = useNavLinks()
	if (isEditRoute) {
		return null
	}

	return (
		<footer className="dark w-full border-t border-[rgb(233,232,238)] bg-gradient-to-b from-slate-900 to-indigo-950 pb-10 pt-16 dark:border-[rgb(33,33,48)]">
			<div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-center gap-10 px-8 pb-56 sm:flex-row sm:justify-between sm:gap-5 sm:px-10">
				<Link href="/">
					<Logo className="origin-left scale-110" withSubtitle />
				</Link>
				<nav>
					{/* <ul className="flex flex-col flex-wrap items-center gap-4 sm:flex-row sm:gap-8">
						{links.map((link) => {
							if (!link.href) {
								return null
							}
							return (
								<li key={link.href}>
									<Link
										href={link.href}
										className="font-heading flex items-center text-base text-white/80 hover:text-white"
									>
										{link.label}
									</Link>
								</li>
							)
						})}
					</ul> */}
				</nav>
				<ThemeToggle className="" />
			</div>
			<p className="text-center text-xs text-violet-200 opacity-75">
				Copyright © {new Date().getFullYear()} EpicAI.pro
			</p>
		</footer>
	)
}
