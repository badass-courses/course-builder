'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogoMark } from '../logo'

export default function Footer() {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')

	if (isEditRoute) {
		return null
	}

	return (
		<footer className="w-full border-t pb-16 pt-20">
			<div className="container mx-auto flex w-full items-center justify-center sm:justify-between">
				<Link
					tabIndex={isRoot ? -1 : 0}
					href="/"
					className="font-heading flex items-center justify-center gap-2 font-semibold leading-none saturate-0"
				>
					<LogoMark className="h-16 w-16" />
					{/* <span className="text-muted-foreground text-3xl font-bold !leading-none">
						AI Hero
					</span> */}
				</Link>
			</div>
			<div className="container mx-auto mt-16 flex w-full items-center justify-center gap-5 font-sans text-sm font-light sm:justify-start">
				<span className="opacity-75">© AIHero.dev</span>
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
