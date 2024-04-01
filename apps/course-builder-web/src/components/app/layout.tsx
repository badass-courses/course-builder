import * as React from 'react'

export async function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className={`font-sans`} id="layout">
			{children}
		</div>
	)
}
