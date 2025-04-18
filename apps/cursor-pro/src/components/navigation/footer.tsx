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

	return <footer></footer>
}
