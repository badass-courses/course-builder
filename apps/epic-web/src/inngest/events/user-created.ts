import { DefaultUser } from 'next-auth'

export const USER_CREATED_EVENT = 'user/created'

export type UserCreated = {
	data: Record<string, never>
	user: DefaultUser
}
