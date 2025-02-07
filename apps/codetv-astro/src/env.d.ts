/// <reference path="../.astro/actions.d.ts" />
/// <reference path="../.astro/db-types.d.ts" />
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@clerk/astro/env" />

declare namespace App {
	interface Locals {
		session: Session | null
		currentUser: () => User | null
	}
}

type Subscription = {
	status: Stripe.Status
	level: string
	customer: Stripe.Customer | Stripe.DeletedCustomer | string
}

declare interface UserPublicMetadata {
	stripe?: Subscription
}

// copy-pasted out of @clerk/backend for use in a util function
type UserMetadataParams = {
	publicMetadata?: UserPublicMetadata
	privateMetadata?: UserPrivateMetadata
	unsafeMetadata?: UserUnsafeMetadata
}
type PasswordHasher =
	| 'argon2i'
	| 'argon2id'
	| 'awscognito'
	| 'bcrypt'
	| 'bcrypt_sha256_django'
	| 'md5'
	| 'pbkdf2_sha256'
	| 'pbkdf2_sha256_django'
	| 'pbkdf2_sha1'
	| 'phpass'
	| 'scrypt_firebase'
	| 'scrypt_werkzeug'
	| 'sha256'
type UserPasswordHashingParams = {
	passwordDigest: string
	passwordHasher: PasswordHasher
}
type CreateUserParams = {
	externalId?: string
	emailAddress?: string[]
	phoneNumber?: string[]
	username?: string
	password?: string
	firstName?: string
	lastName?: string
	skipPasswordChecks?: boolean
	skipPasswordRequirement?: boolean
	totpSecret?: string
	backupCodes?: string[]
	createdAt?: Date
} & UserMetadataParams &
	(UserPasswordHashingParams | object)
