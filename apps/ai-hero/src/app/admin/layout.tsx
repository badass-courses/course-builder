import React from 'react'
import { FileText, Mail, TicketIcon } from 'lucide-react'

import { NavItem } from './pages/_components/nav-link'

const AdminLayout: React.FC<
	React.PropsWithChildren<{
		params: {
			module: string
		}
	}>
> = async ({ children, params }) => {
	return (
		<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
			<div className="bg-muted/40 hidden border-r md:block">
				<div className="flex h-full max-h-screen flex-col gap-2">
					<nav className="">
						<ul>
							<li className="divide-border flex flex-col divide-y">
								<NavItem href="/admin">
									<HomeIcon className="h-4 w-4" />
									Dashboard
								</NavItem>
								<NavItem href="/admin/pages">
									<FileText className="h-4 w-4" />
									Pages
								</NavItem>
								<NavItem href="/admin/coupons">
									<TicketIcon className="h-4 w-4" />
									Coupons
								</NavItem>
								<NavItem href="/admin/emails">
									<Mail className="h-4 w-4" />
									Emails
								</NavItem>
							</li>
						</ul>
					</nav>
				</div>
			</div>
			<div className="flex flex-col">{children}</div>
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