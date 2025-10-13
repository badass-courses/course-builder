import React from 'react'
import { redirect } from 'next/navigation'
import { getAbility } from '@/ability'
import LayoutWithImpersonation from '@/components/layout-with-impersonation'
import { getImpersonatedSession } from '@/server/auth'
import {
	FileText,
	Flag,
	Lightbulb,
	ListChecks,
	Mail,
	TagIcon,
	TicketIcon,
	Users,
} from 'lucide-react'

import { NavItem } from './pages/_components/nav-link'

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
	const { session, ability } = await getImpersonatedSession()

	if (!ability.can('manage', 'all')) {
		redirect('/')
	}

	return (
		<LayoutWithImpersonation>
			<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]">
				<div className="hidden border-r border-t md:block">
					<div className="flex h-full max-h-screen flex-col gap-2">
						<nav className="">
							<ul>
								<li className="divide-border flex flex-col divide-y">
									<NavItem href="/admin/pages">
										<FileText className="h-4 w-4" />
										Pages
									</NavItem>
									<NavItem href="/admin/posts">
										<ListChecks className="h-4 w-4" />
										Posts
									</NavItem>
									<NavItem href="/admin/tips">
										<Lightbulb className="h-4 w-4" />
										Tips
									</NavItem>
									<NavItem href="/admin/contributors">
										<Users className="h-4 w-4" />
										Contributors
									</NavItem>
								</li>
							</ul>
						</nav>
					</div>
				</div>
				<div className="flex flex-col">{children}</div>
			</div>
		</LayoutWithImpersonation>
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
