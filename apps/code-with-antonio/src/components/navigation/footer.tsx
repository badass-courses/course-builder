'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogoMark } from '../brand/logo'

export default function Footer() {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')

	if (isEditRoute) {
		return null
	}

	return (
		<footer className="flex w-full flex-col items-center justify-center border-t px-5 pb-16 pt-20 lg:px-16">
			<div className="mx-auto flex w-full items-center justify-center">
				<Link
					tabIndex={isRoot ? -1 : 0}
					href="/"
					className="font-heading flex items-center justify-center gap-2 font-semibold leading-none saturate-0"
				>
					<LogoMark className="h-12 w-12" />
				</Link>
			</div>
			<div className="mx-auto mt-16 flex w-full items-center justify-center gap-5 font-sans text-sm font-light">
				<span className="opacity-75">© AIHero.dev</span>
				<Link
					className="opacity-75 transition hover:opacity-100"
					href="/privacy"
				>
					Terms & Conditions
				</Link>
				<Link className="opacity-75 transition hover:opacity-100" href="/faq">
					FAQ
				</Link>
			</div>
		</footer>
	)
}
