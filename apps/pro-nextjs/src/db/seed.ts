import fs from 'fs/promises'
import { db } from '@/db/index'
import {
	accounts,
	communicationChannel,
	communicationPreferenceTypes,
	contributionTypes,
	permissions,
	resourceProgress,
	rolePermissions,
	roles,
	users,
} from '@/db/schema'

const currentContributionTypes = await db.query.contributionTypes.findMany()

const seededContributionTypes = [
	{
		name: 'Author',
		slug: 'author',
		id: 'contribution_type_clt4wta5w000808l5c1qi0ud4',
	},

	{
		name: 'Editor',
		slug: 'editor',
		id: 'contribution_type_clt4wubil000908l50ikcd7dx',
	},
]

for (const seedType of seededContributionTypes) {
	const existingContributionType = currentContributionTypes.find(
		(ct) => ct.slug === seedType.slug,
	)

	if (!existingContributionType) {
		await db.insert(contributionTypes).values(seedType)
	}
}

const currentRoles = await db.query.roles.findMany()

const seededRoles = [
	{
		name: 'admin',
		id: 'role_clt4wrrsf000708l57dekazpz',
	},
	{
		name: 'user',
		id: 'role_clt4wr3rb000608l5ganmfufy',
	},
	{
		name: 'contributor',
		id: 'role_clt5a97j7000008jp46bx6r62',
	},
]

for (const seedRole of seededRoles) {
	const existingRole = currentRoles.find((role) => role.name === seedRole.name)

	if (!existingRole) {
		await db.insert(roles).values(seedRole)
	}
}

const currentPermissions = await db.query.permissions.findMany()

const seededPermissions = [
	{
		name: 'manage_all',
		id: 'permission_clt4wyrpb000a08l5a6xq44hk',
	},
	{
		name: 'create_content',
		id: 'permission_clu4sbes9000008id7fk53csk',
	},
	{
		name: 'view_content',
		id: 'permission_clu4sbum4000108id19170x80',
	},
]

for (const seedPermission of seededPermissions) {
	const existingPermission = currentPermissions.find(
		(permission) => permission.name === seedPermission.name,
	)

	if (!existingPermission) {
		await db.insert(permissions).values(seedPermission)
	}
}

const currentRolePermissions = await db.query.rolePermissions.findMany()

const seededRolePermissions = [
	{
		roleId: 'role_clt4wrrsf000708l57dekazpz',
		permissionId: 'permission_clt4wyrpb000a08l5a6xq44hk',
	},
	{
		roleId: 'role_clt5a97j7000008jp46bx6r62',
		permissionId: 'permission_clu4sbes9000008id7fk53csk',
	},
	{
		roleId: 'role_clt5a97j7000008jp46bx6r62',
		permissionId: 'permission_clu4sbum4000108id19170x80',
	},
]

for (const seedRolePermission of seededRolePermissions) {
	const existingRolePermission = currentRolePermissions.find(
		(rp) =>
			rp.roleId === seedRolePermission.roleId &&
			rp.permissionId === seedRolePermission.permissionId,
	)

	if (!existingRolePermission) {
		await db.insert(rolePermissions).values(seedRolePermission)
	}
}

const currentCommunicationPreferenceTypes =
	await db.query.communicationPreferenceTypes.findMany()

const seededCommunicationPreferenceTypes = [
	{
		name: 'Newsletter',
		id: 'cpt_rwhtwq000208jph3jy2utu',
		description: 'Semi-Regular News and Updates',
	},
]

for (const seedPreferenceType of seededCommunicationPreferenceTypes) {
	const existingPreferenceType = currentCommunicationPreferenceTypes.find(
		(cpt) => cpt.name === seedPreferenceType.name,
	)

	if (!existingPreferenceType) {
		await db.insert(communicationPreferenceTypes).values(seedPreferenceType)
	}
}

const currentCommunicationChannels =
	await db.query.communicationChannel.findMany()

const seededCommunicationChannels = [
	{
		name: 'Email',
		id: 'cc_rwl5qg000008jr69rw2iww',
		description: 'Email Communication',
	},
]

for (const seedChannel of seededCommunicationChannels) {
	const existingChannel = currentCommunicationChannels.find(
		(cc) => cc.name === seedChannel.name,
	)

	if (!existingChannel) {
		await db.insert(communicationChannel).values(seedChannel)
	}
}

// ACCOUNTS

// const currentAccounts = await db.query.accounts.findMany()

// const seededAccounts = await fs.readFile(
// 	'./src/db/seed-data/Account.json',
// 	'utf-8',
// )

// for (const seedAccount of JSON.parse(seededAccounts)) {
// 	const existingAccount = currentAccounts.find(
// 		(acc) => acc.userId === seedAccount.userId,
// 	)

// 	if (!existingAccount) {
// 		await db.insert(accounts).values(seedAccount)
// 	}
// }

// RESOURCE PROGRESS

// type OldProgressType = {
// 	id: string
// 	userId: string
// 	lessonId: string
// 	sectionId: string
// 	moduleId: string
// 	lessonSlug: string
// 	lessonVersion: string
// 	completedAt: string
// 	updatedAt: string
// 	createdAt: string
// }

// const currentResourceProgress = await db.query.resourceProgress.findMany()

// const seededProgressData = await fs.readFile(
// 	'./src/db/seed-data/LessonProgress.json',
// 	'utf-8',
// )
// const seededProgress: OldProgressType[] = JSON.parse(seededProgressData)

// for (const seedProgress of seededProgress) {
// 	const existingProgress = currentResourceProgress.find(
// 		(rp) =>
// 			// TODO: Check if this is the right field to compare
// 			rp.contentResourceId === seedProgress.lessonId &&
// 			rp.userId === seedProgress.userId,
// 	)

// 	if (!existingProgress) {
// 		await db.insert(resourceProgress).values({
// 			userId: seedProgress.userId,
// 			completedAt: new Date(seedProgress.completedAt),
// 			contentResourceId: seedProgress.lessonId,
// 			createdAt: new Date(seedProgress.createdAt),
// 			updatedAt: new Date(seedProgress.updatedAt),
// 			fields: {},
// 		})
// 	}
// }

// USERS

// type OldUserType = {
// 	id: string
// 	name: string | null
// 	email: string
// 	emailVerified: string | null
// 	image: string | null
// 	roles: 'user' | 'ADMIN' | 'SUPERADMIN'
// 	fields: any | {}
// }

// const seededUserData = await fs.readFile(
// 	'./src/db/seed-data/User.json',
// 	'utf-8',
// )

// const seededUsers: OldUserType[] = JSON.parse(seededUserData)

// const currentUsers = await db.query.users.findMany()

// for (const seedUser of seededUsers) {
// 	const existingUser = currentUsers.find((user) => user.id === seedUser.id)

// 	if (!existingUser) {
// 		await db.insert(users).values({
// 			id: seedUser.id,
// 			email: seedUser.email,
// 			emailVerified: seedUser.emailVerified
// 				? new Date(seedUser.emailVerified)
// 				: null,
// 			image: seedUser?.image || null,
// 			name: seedUser?.name || null,
// 			role:
// 				seedUser?.roles === 'ADMIN' || seedUser?.roles === 'SUPERADMIN'
// 					? 'admin'
// 					: seedUser?.roles || 'User',
// 			createdAt: new Date(),
// 			// fields: seedUser.fields || null,
// 		})
// 	}
// }
