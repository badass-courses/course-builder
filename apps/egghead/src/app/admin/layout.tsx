import React from 'react'
import { notFound } from 'next/navigation'
import {
	Sidebar,
	SidebarContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { getServerAuthSession } from '@/server/auth'
import { CalendarIcon, MailIcon, MicIcon, TagIcon } from 'lucide-react'

const adminSidebar = [
	{
		label: 'Instructors',
		href: '/admin/instructors',
		icon: MicIcon,
	},
	{
		label: 'Instructor Invites',
		href: '/admin/instructors/invite',
		icon: MailIcon,
	},
	{
		label: 'Tags',
		href: '/admin/tags',
		icon: TagIcon,
	},
	{
		label: 'Events',
		href: '/admin/events',
		icon: CalendarIcon,
	},
]

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
	const { ability } = await getServerAuthSession()
	if (!ability.can('manage', 'all')) {
		notFound()
	}

	return (
		<SidebarProvider>
			<Sidebar className="pt-24">
				<SidebarContent className="px-4">
					<SidebarMenu>
						{adminSidebar.map((item) => (
							<SidebarMenuItem key={item.label}>
								<SidebarMenuButton asChild>
									<a href={item.href}>
										<item.icon />
										<span>{item.label}</span>
									</a>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarContent>
			</Sidebar>
			<main className="w-full p-10">
				<SidebarTrigger />
				<div>{children}</div>
			</main>
		</SidebarProvider>
	)
}

export default AdminLayout
