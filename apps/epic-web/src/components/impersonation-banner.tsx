import Image from 'next/image'
import { stopImpersonation } from '@/app/admin/contributors/actions'
import { getImpersonatedSession } from '@/server/auth'

import { Button } from '@coursebuilder/ui'

export async function ImpersonationBanner() {
	const { session, isImpersonating, originalUserId } =
		await getImpersonatedSession()

	if (!isImpersonating || !session?.user) {
		return null
	}

	return (
		<div className="relative z-50 flex items-center justify-center gap-3 bg-orange-500 px-4 py-3 text-sm font-medium text-white shadow-lg">
			<div className="flex items-center gap-3">
				{session.user.image && (
					<Image
						src={session.user.image}
						alt=""
						width={32}
						height={32}
						className="rounded-full border-2 border-white/20"
					/>
				)}
				<div className="flex flex-col">
					<span className="font-semibold">
						🎭 Impersonating {session.user.name || 'User'}
					</span>
					<span className="text-xs opacity-90">
						{session.user.email} • Role:{' '}
						{session.user.roles?.map((r: any) => r.name).join(', ') ||
							session.user.role ||
							'user'}
					</span>
				</div>
			</div>
			<form action={stopImpersonation}>
				<Button
					size="sm"
					variant="secondary"
					className="bg-white text-orange-600 hover:bg-gray-100"
				>
					Stop Impersonating
				</Button>
			</form>
		</div>
	)
}
