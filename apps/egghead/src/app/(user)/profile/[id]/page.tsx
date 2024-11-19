import { redirect } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { db } from '@/db'
import { getServerAuthSession } from '@/server/auth'

import EditProfileForm from '../_components/edit-profile-form'

export default async function ProfilePage({
	params,
}: {
	params: { id: string }
}) {
	const { session, ability } = await getServerAuthSession()

	const fullUser = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, params.id),
		with: {
			profiles: true,
		},
	})

	if (
		ability.can('manage', 'all') ||
		ability.can('read', 'User', session.user?.id)
	) {
		return (
			<Layout>
				<div className="mx-auto flex w-full max-w-screen-lg flex-col items-start gap-8 px-5 py-20 sm:gap-10 sm:py-16 md:flex-row lg:gap-16">
					<header className="w-full md:max-w-[230px]">
						<h1 className="fluid-xl text-center font-bold md:text-left">
							Your Profile
						</h1>
					</header>
					<main className="flex w-full flex-col space-y-10 md:max-w-md">
						<EditProfileForm user={fullUser} />
					</main>
				</div>
			</Layout>
		)
	}

	redirect('/')
}
