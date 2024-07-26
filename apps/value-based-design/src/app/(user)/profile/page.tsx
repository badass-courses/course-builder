import { redirect } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

import EditProfileForm from './_components/edit-profile-form'

export default async function ProfilePage() {
	const { session, ability } = await getServerAuthSession()

	if (ability.can('read', 'User', session?.user?.id)) {
		return (
			<div className="mx-auto flex w-full max-w-screen-lg flex-col items-start gap-8 px-5 py-20 sm:gap-16 sm:py-32 md:flex-row">
				<header className="w-full md:max-w-[230px]">
					<h1 className="text-center text-xl font-bold md:text-left">
						Your Profile
					</h1>
				</header>
				<main className="flex w-full flex-col space-y-10 md:max-w-md">
					<EditProfileForm user={session.user} />
				</main>
			</div>
		)
	}

	redirect('/')
}
