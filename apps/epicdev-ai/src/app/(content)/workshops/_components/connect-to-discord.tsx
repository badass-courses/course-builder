import { DiscordConnectButton } from '@/app/discord/discord-connect-button'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getServerAuthSession, Provider } from '@/server/auth'
import { AbilityForResource } from '@/utils/get-current-ability-rules'
import { eq } from 'drizzle-orm'

export const ConnectToDiscord = async ({
	discordProvider,
	abilityLoader,
}: {
	discordProvider?: Provider
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
}) => {
	const { session } = await getServerAuthSession()
	const { canViewWorkshop: canView } = await abilityLoader

	if (!session?.user?.id || !canView) {
		return null
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, session?.user?.id),
		with: {
			accounts: true,
		},
	})

	const discordConnected = Boolean(
		user?.accounts.find((account: any) => account.provider === 'discord'),
	)

	if (discordConnected) {
		return null
	}

	return (
		<>
			{discordProvider ? (
				<div className="flex h-12 w-full items-center justify-center rounded-none md:w-auto">
					<DiscordConnectButton discordProvider={discordProvider}>
						Join Discord
					</DiscordConnectButton>
				</div>
			) : null}
		</>
	)
}
