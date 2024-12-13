import React from 'react'
import Link from 'next/link'
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
import { ShieldIcon, UserCircleIcon, UserIcon } from 'lucide-react'

async function ProfileLayout({ children }: { children: React.ReactNode }) {
	const { session } = await getServerAuthSession()

	return (
		<SidebarProvider>
			<Sidebar className="pt-24">
				<SidebarContent className="px-4">
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href={`/profile/account/${session?.user?.id}`}>
									<UserIcon />
									<span>Account</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link href={`/profile/${session?.user?.id}`}>
									<UserCircleIcon />
									<span>Profile</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
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

export default ProfileLayout
