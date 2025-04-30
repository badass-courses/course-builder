import { UserSchema } from '@/ability'
import { z } from 'zod'

export const TEST_USER = {
	id: 'test-user-id',
	email: 'test@example.com',
	name: 'Test User',
	roles: [
		{
			id: 'test-role-id',
			name: 'user',
			description: null,
			active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		},
	],
	organizationRoles: [],
	entitlements: [
		{
			type: 'post',
			expires: null,
			metadata: {},
		},
	],
}

export const TEST_ADMIN = {
	...TEST_USER,
	id: 'test-admin-id',
	roles: [
		{
			id: 'admin-role-id',
			name: 'admin',
			description: null,
			active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		},
	],
}

export const TEST_TOKEN = 'test-auth-token'

export function createAuthHeaders(token = TEST_TOKEN) {
	return {
		Authorization: `Bearer ${token}`,
	}
}

// Validate that our test users match the schema
UserSchema.parse(TEST_USER)
UserSchema.parse(TEST_ADMIN)
