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
		<LayoutClient>
			<div className="flex min-h-screen w-full grid-cols-12 flex-col-reverse gap-5 md:grid">
				<div className="bg-muted border-border col-span-2 hidden overflow-hidden border-r md:block">
					<div className="flex h-full max-h-screen flex-col gap-2">
						<nav className="">
							<ul>
								<li className="divide-border flex flex-col divide-y">
									<NavItem href="/admin/dashboard">
										<HomeIcon className="size-4" />
										Dashboard
									</NavItem>
									<NavItem href="/admin/pages">
										<FileText className="size-4" />
										Pages
									</NavItem>
									<NavItem href="/lists">
										<ListChecks className="size-4" />
										Lists
									</NavItem>
									<NavItem href="/admin/coupons">
										<TicketIcon className="size-4" />
										Coupons
									</NavItem>
									<NavItem href="/admin/surveys">
										<svg
											className="size-4"
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
											<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
											<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
											<path d="M12 17h.01" />
										</svg>
										Surveys
									</NavItem>
									<NavItem href="/admin/tags">
										<TagIcon className="size-4" />
										Tags
									</NavItem>
									<NavItem href="/admin/emails">
										<Mail className="size-4" />
										Emails
									</NavItem>
									<NavItem href="/admin/flags">
										<Flag className="size-4" />
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
