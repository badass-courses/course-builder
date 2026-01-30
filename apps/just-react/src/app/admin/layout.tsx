import React from 'react'
import LayoutClient from '@/components/layout-client'
import {
	FileText,
	Flag,
	ListChecks,
	Mail,
	TagIcon,
	TicketIcon,
} from 'lucide-react'

import { NavItem } from './pages/_components/nav-link'

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
	return (
		<LayoutClient className="mx-auto w-full">
			<div className="min-h-fullscreen flex w-full grid-cols-12 flex-col-reverse md:grid">
				<div className="min-h-fullscreen bg-muted relative col-span-2 hidden border-r md:block">
					<div className="flex flex-col">
						<nav className="overflow-hidden">
							<ul>
								<li className="divide-border flex flex-col divide-y">
									<NavItem href="/admin/dashboard">
										<HomeIcon className="h-4 w-4" />
										Dashboard
									</NavItem>
									<NavItem href="/admin/pages">
										<FileText className="h-4 w-4" />
										Pages
									</NavItem>
									<NavItem href="/lists">
										<ListChecks className="h-4 w-4" />
										Lists
									</NavItem>
									<NavItem href="/admin/coupons">
										<TicketIcon className="h-4 w-4" />
										Coupons
									</NavItem>
									<NavItem href="/admin/tags">
										<TagIcon className="h-4 w-4" />
										Tags
									</NavItem>
									<NavItem href="/admin/emails">
										<Mail className="h-4 w-4" />
										Emails
									</NavItem>
									<NavItem href="/admin/flags">
										<Flag className="h-4 w-4" />
										Feature Flags
									</NavItem>
								</li>
							</ul>
						</nav>
					</div>
				</div>
				<div className="col-span-10 flex flex-col">{children}</div>
			</div>
		</LayoutClient>
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
