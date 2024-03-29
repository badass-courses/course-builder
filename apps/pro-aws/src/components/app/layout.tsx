import * as React from 'react'
import { patron } from '@/utils/load-fonts'

export async function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className={`relative ${patron.variable} font-sans`} id="layout">
			{children}
		</div>
	)
}
