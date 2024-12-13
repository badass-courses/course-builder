import React from 'react'
import {
	Sidebar,
	SidebarContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { MailIcon, MicIcon, TagIcon } from 'lucide-react'

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
]

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
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
