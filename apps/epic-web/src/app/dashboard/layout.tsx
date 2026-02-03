import React from 'react'
import LayoutWithImpersonation from '@/components/layout-with-impersonation'
import { FileText, Lightbulb, Presentation, User } from 'lucide-react'

import { NavItem } from '../admin/pages/_components/nav-link'

/**
 * Dashboard layout for contributors.
 * Provides a sidebar navigation to profile, posts, and tips.
 */
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
	return (
		<LayoutWithImpersonation>
			<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]">
				<div className="hidden border-r border-t md:block">
					<div className="flex h-full max-h-screen flex-col gap-2">
						<nav>
							<ul>
								<li className="divide-border flex flex-col divide-y">
									<NavItem href="/dashboard">
										<User className="h-4 w-4" /> Profile
									</NavItem>
									<NavItem href="/dashboard/posts">
										<FileText className="h-4 w-4" /> Posts
									</NavItem>
									<NavItem href="/dashboard/tips">
										<Lightbulb className="h-4 w-4" /> Tips
									</NavItem>
									<NavItem href="/dashboard/workshops">
										<Presentation className="h-4 w-4" /> Workshops
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

export default DashboardLayout
