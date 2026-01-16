import React from 'react'
import LayoutClient from '@/components/layout-client'
import {
	DollarSign,
	FileText,
	Flag,
	LayoutDashboard,
	ListChecks,
	Mail,
	Presentation,
	TagIcon,
	TicketIcon,
	UserCircle,
} from 'lucide-react'

import { NavItem } from './pages/_components/nav-link'

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
	return (
		<LayoutClient withContainer>
			<div className="flex min-h-screen w-full grid-cols-12 flex-col-reverse gap-5 md:grid">
				<div className="bg-card col-span-2 hidden overflow-hidden rounded-lg border shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)] md:block">
					<div className="flex h-full max-h-screen flex-col gap-2">
						<nav className="">
							<ul>
								<li className="divide-border flex flex-col divide-y">
									<NavItem href="/admin">
										<LayoutDashboard className="h-4 w-4" />
										Dashboard
									</NavItem>
									<NavItem href="/admin/pages">
										<FileText className="h-4 w-4" />
										Pages
									</NavItem>
									<NavItem href="/products">
										<DollarSign className="h-4 w-4" />
										Products
									</NavItem>
									<NavItem href="/admin/coupons">
										<TicketIcon className="h-4 w-4" />
										Coupons
									</NavItem>
									<NavItem href="/events">
										<Presentation className="h-4 w-4" />
										Events
									</NavItem>
									<NavItem href="/lists">
										<ListChecks className="h-4 w-4" />
										Lists
									</NavItem>
									<NavItem href="/admin/tags">
										<TagIcon className="h-4 w-4" />
										Tags
									</NavItem>
									<NavItem href="/admin/authors">
										<UserCircle className="h-4 w-4" />
										Authors
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
