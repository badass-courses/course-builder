import React from 'react'
import Link from 'next/link'

import { Badge } from '@coursebuilder/ui'

const AdminLayout = async (props: { children: React.ReactNode }) => {
	return (
		<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
			<div className="bg-muted/40 hidden border-r md:block">
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex-1">
						<nav className="grid items-start px-2 text-sm font-medium lg:px-4">
							<Link
								href="/admin/dashboard"
								className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
								prefetch={false}
							>
								<HomeIcon className="h-4 w-4" />
								Dashboard
							</Link>
							<Link
								href="/admin/coupons"
								className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
								prefetch={false}
							>
								<HomeIcon className="h-4 w-4" />
								Coupons
							</Link>
							<Link
								href="/admin/pages"
								className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
								prefetch={false}
							>
								<HomeIcon className="h-4 w-4" />
								Pages
							</Link>
							<Link
								href="/admin/emails"
								className="text-muted-foreground hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
								prefetch={false}
							>
								<HomeIcon className="h-4 w-4" />
								Emails
							</Link>
						</nav>
					</div>
				</div>
			</div>
			<div className="flex flex-col">{props.children}</div>
		</div>
	)
}

export default AdminLayout

function HomeIcon(props: any) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
			<polyline points="9 22 9 12 15 12 15 22" />
		</svg>
	)
}
