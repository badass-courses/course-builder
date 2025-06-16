import { DiscordConnectButton } from '@/app/discord/discord-connect-button'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getServerAuthSession, Provider } from '@/server/auth'
import { eq } from 'drizzle-orm'

export const ConnectToDiscord = async ({
	discordProvider,
}: {
	discordProvider?: Provider
}) => {
	const { session } = await getServerAuthSession()

	if (!session?.user?.id) {
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
				<div className="h-14 w-full rounded-none md:w-auto md:border-r">
					<DiscordConnectButton discordProvider={discordProvider}>
						Join Discord
					</DiscordConnectButton>
				</div>
			) : null}
		</>
	)
}
