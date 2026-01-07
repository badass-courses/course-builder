export type DiscordUser = {
	id: string
	username: string
	discriminator: string
	avatar?: string
}
export type DiscordMember = { user: DiscordUser; roles: Array<string> }
export type DiscordError = { message: string; code: number }
