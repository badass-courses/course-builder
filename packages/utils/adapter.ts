import { createHash, randomInt, randomUUID } from 'crypto'
import { afterAll, beforeAll, expect, test } from 'vitest'

import { CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import {
	MerchantCoupon,
	Product,
	purchaseSchema,
} from '@coursebuilder/core/schemas'

export interface TestOptions {
	adapter: CourseBuilderAdapter
	fixtures?: {
		user?: any
		session?: any
		account?: any
		purchase?: any
		sessionUpdateExpires?: Date
		verificationTokenExpires?: Date
		createdAt?: Date
		product?: any
		upgradeProduct?: any
		price?: any
		upgradePrice?: any
		coupon?: any
		largeCoupon?: any
		indiaCoupon?: any
		standardMerchantCoupons?: any[]
	}
	db: {
		/** Generates UUID v4 by default. Use it to override how the test suite should generate IDs, like user id. */
		id?: () => string | undefined
		/**
		 * Manually disconnect database after all tests have been run,
		 * if your adapter doesn't do it automatically
		 */
		disconnect?: () => Promise<any>
		/**
		 * Manually establishes a db connection before all tests,
		 * if your db doesn't do this automatically
		 */
		connect?: () => Promise<any>
		/** A simple query function that returns a session directly from the db. */
		session: (sessionToken: string) => any
		purchase: (id: string) => any
		/** A simple query function that returns a user directly from the db. */
		user: (id: string) => any
		/** A simple query function that returns an account directly from the db. */
		account: (providerAccountId: {
			provider: string
			providerAccountId: string
		}) => any
		/**
		 * A simple query function that returns a verification token directly from the db,
		 * based on the user identifier and the verification token (hashed).
		 */
		verificationToken: (params: { identifier: string; token: string }) => any
		/**
		 * A simple query function that returns an authenticator directly from the db.
		 */
		authenticator?: (credentialID: string) => any
		createProduct?: (product: Product, price?: any) => any
		deleteProduct?: (productId: string) => any
		createCoupon?: (coupon: any) => any
		createMerchantCoupon?: (merchantCoupo: any) => any
		deleteMerchantCoupons?: () => any
		deleteMerchantCoupon?: (id: string) => any
		createStandardMerchantCoupons?: () => any
		createPurchase?: (purchase: any) => any
		getPriceForProduct?: (productId: string) => any
		deletePurchases?: (productId: string) => any
		createUpgradableProduct?: (
			upgradeFromId: string,
			upgradeToId: string,
		) => any
	}
	skipTests?: string[]
	/**
	 * Enables testing of WebAuthn methods.
	 */
	testWebAuthnMethods?: boolean
}

export async function runBasicTests(options: TestOptions) {
	const id = () => options.db.id?.() ?? randomUUID()
	// Init
	beforeAll(async () => {
		await options.db.connect?.()
	})

	const {
		adapter: _adapter,
		db,
		skipTests: skipTests = [],
		testWebAuthnMethods,
	} = options
	const adapter = _adapter as Required<CourseBuilderAdapter>

	if (!testWebAuthnMethods) {
		skipTests.push(
			...[
				'getAccount',
				'getAuthenticator',
				'createAuthenticator',
				'listAuthenticatorsByUserId',
				'updateAuthenticatorCounter',
			],
		)
	}

	const maybeTest = (
		method: keyof CourseBuilderAdapter,
		...args: Parameters<typeof test> extends [any, ...infer U] ? U : never
	) =>
		skipTests.includes(method)
			? test.skip(method, ...args)
			: test(method, ...args)

	afterAll(async () => {
		// @ts-expect-error This is only used for the TypeORM adapter
		await adapter.__disconnect?.()
		await options.db.disconnect?.()
	})

	let user = options.fixtures?.user ?? {
		id: id(),
		email: 'fill@murray.com',
		image: 'https://www.fillmurray.com/460/300',
		fields: {},
		name: 'Fill Murray',
		emailVerified: new Date(),
		createdAt: new Date(),
		role: 'user',
	}

	if (process.env.CUSTOM_MODEL === '1') {
		user.role = 'admin'
		user.phone = '00000000000'
	}

	const session: any = options.fixtures?.session ?? {
		sessionToken: id(),
		expires: ONE_WEEK_FROM_NOW,
	}

	const account: any = options.fixtures?.account ?? {
		provider: 'github',
		providerAccountId: id(),
		type: 'oauth',
		access_token: id(),
		expires_at: ONE_MONTH / 1000,
		id_token: id(),
		refresh_token: id(),
		token_type: 'bearer',
		scope: 'user',
		session_state: id(),
		oauth_token: null,
		oauth_token_secret: null,
		refresh_token_expires_in: null,
	}

	// All adapters must define these methods

	test('Required (User, Account, Session, Content) methods exist', () => {
		const requiredMethods = [
			'createContentResource',
			'getContentResource',
			'getVideoResource',
			'updateContentResourceFields',
			'createUser',
			'getUser',
			'getUserByEmail',
			'getUserByAccount',
			'updateUser',
			'linkAccount',
			'createSession',
			'getSessionAndUser',
			'updateSession',
			'deleteSession',
		]
		requiredMethods.forEach((method) => {
			expect(adapter).toHaveProperty(method)
		})
	})

	test('createMerchantChargeAndPurchase', async () => {
		const purchase = await adapter.createMerchantChargeAndPurchase({
			userId: id(),
			productId: id(),
			stripeChargeId: id(),
			merchantAccountId: id(),
			appliedPPPStripeCouponId: undefined,
			upgradedFromPurchaseId: undefined,
			usedCouponId: undefined,
			merchantProductId: id(),
			merchantCustomerId: id(),
			stripeChargeAmount: 1000,
			quantity: 1,
			checkoutSessionId: id(),
			country: 'US',
		})
		const newPurchase = await adapter.getPurchase(purchase.id)
		expect(newPurchase).toEqual(purchaseSchema.parse(purchase))
	})

	test('getPurchase returns a purchase', async () => {
		const newPurchase = await adapter.createPurchase({
			userId: user.id,
			productId: id(),
			merchantChargeId: id(),
			merchantSessionId: id(),
			totalAmount: '123',
		})

		const purchase = await adapter.getPurchase(newPurchase.id)

		expect(purchase).toBeTruthy()
	})

	test('createPurchase returns a new purchase', async () => {
		const purchase = await adapter.createPurchase({
			userId: user.id,
			productId: id(),
			merchantChargeId: id(),
			merchantSessionId: id(),
			totalAmount: '123',
		})

		const parsedPurchase = purchaseSchema.safeParse(purchase)

		expect(parsedPurchase.success).toBeTruthy()
	})

	test('getPurchasesForUser returns a list of purchases', async () => {
		await adapter.createPurchase({
			userId: user.id,
			productId: id(),
			merchantChargeId: id(),
			merchantSessionId: id(),
			totalAmount: '1232',
		})
		await adapter.createPurchase({
			userId: user.id,
			productId: id(),
			merchantChargeId: id(),
			merchantSessionId: id(),
			totalAmount: '123',
		})
		const purchases = await adapter.getPurchasesForUser(user.id)

		expect(purchases.length).toBeGreaterThanOrEqual(2)
	})

	test('createContentResource', async () => {
		const resource = {
			id: id(),
			type: 'tip',
			currentVersionId: null,
			createdByOrganizationMembershipId: null,
			organizationId: null,
			createdById: user.id,
			createdAt: new Date(),
			deletedAt: null,
			updatedAt: new Date(),
			fields: {
				title: 'Video Titles',
				slug: 'video-titles',
			},
			slug: 'video-titles', // Generated from fields.slug
			resources: [],
		}
		const createdResource = await adapter.createContentResource(resource)
		expect(createdResource).toEqual(resource)
	})

	test('updateContentResourceFields', async () => {
		const resource = {
			id: id(),
			type: 'tip',
			createdById: user.id,
			createdAt: new Date(),
			deletedAt: null,
			updatedAt: new Date(),
			fields: {
				title: 'Video Titles',
				slug: 'video-titles',
			},
			slug: 'video-titles', // Generated from fields.slug
		}
		const createdResource = await adapter.createContentResource(resource)
		const updatedResource = await adapter.updateContentResourceFields({
			id: createdResource.id,
			fields: {
				title: 'Updated Video Titles',
				slug: 'video-titles',
			},
		})
		expect(updatedResource).toEqual({
			...createdResource,
			fields: {
				title: 'Updated Video Titles',
				slug: 'video-titles',
			},
		})
	})

	test('createUser', async () => {
		const { id } = await adapter.createUser(user)
		const dbUser = await db.user(id)
		expect(dbUser).toEqual({ ...user, id })
		user = dbUser
		session.userId = dbUser.id
		account.userId = dbUser.id
	})

	test('getUser', async () => {
		expect(await adapter.getUser(id())).toBeNull()
		expect(await adapter.getUser(user.id)).toEqual(user)
	})

	test('getUserByEmail', async () => {
		expect(await adapter.getUserByEmail('non-existent-email')).toBeNull()
		expect(await adapter.getUserByEmail(user.email)).toEqual(user)
	})

	test('createSession', async () => {
		const { sessionToken } = await adapter.createSession(session)
		const dbSession = await db.session(sessionToken)

		expect(dbSession).toEqual({ ...session, id: dbSession.id })
		session.userId = dbSession.userId
		session.id = dbSession.id
	})

	test('getSessionAndUser', async () => {
		let sessionAndUser = await adapter.getSessionAndUser('invalid-token')
		expect(sessionAndUser).toBeNull()

		sessionAndUser = await adapter.getSessionAndUser(session.sessionToken)
		if (!sessionAndUser) {
			throw new Error('Session and User was not found, but they should exist')
		}
		expect(sessionAndUser).toEqual({
			user,
			session,
		})
	})

	test('updateUser', async () => {
		const newName = 'Updated Name'
		const returnedUser = await adapter.updateUser({
			id: user.id,
			name: newName,
		})
		expect(returnedUser.name).toBe(newName)

		const dbUser = await db.user(user.id)
		expect(dbUser.name).toBe(newName)
		user.name = newName
	})

	test('updateSession', async () => {
		let dbSession = await db.session(session.sessionToken)

		const expires = options.fixtures?.sessionUpdateExpires ?? ONE_MONTH_FROM_NOW

		expect(dbSession.expires.valueOf()).not.toBe(expires.valueOf())

		await adapter.updateSession({
			sessionToken: session.sessionToken,
			expires,
		})

		dbSession = await db.session(session.sessionToken)
		expect(dbSession.expires.valueOf()).toBe(expires.valueOf())
	})

	test('linkAccount', async () => {
		await adapter.linkAccount(account)
		const dbAccount = await db.account({
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		})
		expect(dbAccount).toEqual({ ...account, id: dbAccount.id })
	})

	test('getUserByAccount', async () => {
		let userByAccount = await adapter.getUserByAccount({
			provider: 'invalid-provider',
			providerAccountId: 'invalid-provider-account-id',
		})
		expect(userByAccount).toBeNull()

		userByAccount = await adapter.getUserByAccount({
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		})
		expect(userByAccount).toEqual(user)
	})

	test('deleteSession', async () => {
		await adapter.deleteSession(session.sessionToken)
		const dbSession = await db.session(session.sessionToken)
		expect(dbSession).toBeNull()
	})

	// These are optional for custom adapters, but we require them for the official adapters

	test('Verification Token methods exist', () => {
		const requiredMethods = ['createVerificationToken', 'useVerificationToken']
		requiredMethods.forEach((method) => {
			expect(adapter).toHaveProperty(method)
		})
	})

	test('createVerificationToken', async () => {
		const identifier = 'info@example.com'
		const token = id()
		const hashedToken = hashToken(token)

		const verificationToken = {
			token: hashedToken,
			identifier,
			createdAt: options.fixtures?.createdAt ?? new Date(),
			expires:
				options.fixtures?.verificationTokenExpires ?? FIFTEEN_MINUTES_FROM_NOW,
		}
		await adapter.createVerificationToken?.(verificationToken)

		const dbVerificationToken = await db.verificationToken({
			token: hashedToken,
			identifier,
		})

		expect(dbVerificationToken).toEqual(verificationToken)
	})

	test('useVerificationToken', async () => {
		const identifier = 'info@example.com'
		const token = id()
		const hashedToken = hashToken(token)
		const verificationToken = {
			token: hashedToken,
			identifier,
			createdAt: new Date(Date.now() - 2 * 60 * 1000),
			expires:
				options.fixtures?.verificationTokenExpires ?? FIFTEEN_MINUTES_FROM_NOW,
		}
		await adapter.createVerificationToken?.(verificationToken)

		const dbVerificationToken1 = await adapter.useVerificationToken?.({
			identifier,
			token: hashedToken,
		})

		if (!dbVerificationToken1) {
			throw new Error('Verification Token was not found, but it should exist')
		}

		expect(dbVerificationToken1).toEqual(verificationToken)

		const dbVerificationToken2 = await adapter.useVerificationToken?.({
			identifier,
			token: hashedToken,
		})

		expect(dbVerificationToken2).toBeNull()
	})

	// Future methods
	// These methods are not yet invoked in the core, but built-in adapters must implement them
	test('Future methods exist', () => {
		const requiredMethods = ['unlinkAccount', 'deleteUser']
		requiredMethods.forEach((method) => {
			expect(adapter).toHaveProperty(method)
		})
	})

	test('unlinkAccount', async () => {
		let dbAccount = await db.account({
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		})
		expect(dbAccount).toEqual({ ...account, id: dbAccount.id })

		await adapter.unlinkAccount?.({
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		})
		dbAccount = await db.account({
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		})
		expect(dbAccount).toBeNull()
	})

	maybeTest('deleteUser', async () => {
		let dbUser = await db.user(user.id)
		expect(dbUser).toEqual(user)

		// Re-populate db with session and account
		delete session.id
		await adapter.createSession(session)
		await adapter.linkAccount(account)

		await adapter.deleteUser?.(user.id)
		dbUser = await db.user(user.id)
		// User should not exist after it is deleted
		expect(dbUser).toBeNull()

		const dbSession = await db.session(session.sessionToken)

		// Session should not exist after user is deleted
		expect(dbSession).toBeNull()

		const dbAccount = await db.account({
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		})
		// Account should not exist after user is deleted
		expect(dbAccount).toBeNull()
	})

	maybeTest('getAccount', async () => {
		// Setup
		const providerAccountId = randomUUID()
		const provider = 'auth0'
		const localUser = await adapter.createUser({
			id: randomUUID(),
			email: 'getAccount@example.com',
			emailVerified: null,
		})
		await adapter.linkAccount({
			provider,
			providerAccountId,
			type: 'oauth',
			userId: localUser.id,
		})

		// Test
		const invalidBoth = await adapter.getAccount(
			'invalid-provider-account-id',
			'invalid-provider',
		)
		expect(invalidBoth).toBeNull()
		const invalidProvider = await adapter.getAccount(
			providerAccountId,
			'invalid-provider',
		)
		expect(invalidProvider).toBeNull()
		const invalidProviderAccountId = await adapter.getAccount(
			'invalid-provider-account-id',
			provider,
		)
		expect(invalidProviderAccountId).toBeNull()
		const validAccount = await adapter.getAccount(providerAccountId, provider)
		expect(validAccount).not.toBeNull()

		const dbAccount = await db.account({
			provider,
			providerAccountId,
		})
		expect(dbAccount).toMatchObject(validAccount || {})
	})
	maybeTest('createAuthenticator', async () => {
		// Setup
		const credentialID = randomUUID()
		const localUser = await adapter.createUser({
			id: randomUUID(),
			email: 'createAuthenticator@example.com',
			emailVerified: null,
		})
		await adapter.linkAccount({
			provider: 'webauthn',
			providerAccountId: credentialID,
			type: 'webauthn',
			userId: localUser.id,
		})

		// Test
		const authenticatorData = {
			credentialID,
			providerAccountId: credentialID,
			userId: localUser.id,
			counter: randomInt(100),
			credentialBackedUp: true,
			credentialDeviceType: 'platform',
			credentialPublicKey: randomUUID(),
			transports: 'usb,ble,nfc',
		}
		const newAuthenticator =
			await adapter.createAuthenticator(authenticatorData)
		expect(newAuthenticator).not.toBeNull()
		expect(newAuthenticator).toMatchObject(authenticatorData)

		const dbAuthenticator = db.authenticator
			? await db.authenticator(credentialID)
			: undefined
		expect(dbAuthenticator).toMatchObject(newAuthenticator)
	})
	maybeTest('getAuthenticator', async () => {
		// Setup
		const credentialID = randomUUID()
		const localUser = await adapter.createUser({
			id: randomUUID(),
			email: 'getAuthenticator@example.com',
			emailVerified: null,
		})
		await adapter.linkAccount({
			provider: 'webauthn',
			providerAccountId: credentialID,
			type: 'webauthn',
			userId: localUser.id,
		})
		await adapter.createAuthenticator({
			credentialID,
			providerAccountId: credentialID,
			userId: localUser.id,
			counter: randomInt(100),
			credentialBackedUp: true,
			credentialDeviceType: 'platform',
			credentialPublicKey: randomUUID(),
			transports: 'usb,ble,nfc',
		})

		// Test
		const invalidAuthenticator = await adapter.getAuthenticator(
			'invalid-credential-id',
		)
		expect(invalidAuthenticator).toBeNull()

		const validAuthenticator = await adapter.getAuthenticator(credentialID)
		expect(validAuthenticator).not.toBeNull()
		const dbAuthenticator = db.authenticator
			? await db.authenticator(credentialID)
			: undefined
		expect(dbAuthenticator).toMatchObject(validAuthenticator || {})
	})
	maybeTest('listAuthenticatorsByUserId', async () => {
		// Setup
		const user1 = await adapter.createUser({
			id: randomUUID(),
			email: 'listAuthenticatorsByUserId1@example.com',
			emailVerified: null,
		})
		const user2 = await adapter.createUser({
			id: randomUUID(),
			email: 'listAuthenticatorsByUserId2@example.com',
			emailVerified: null,
		})
		const credentialID1 = randomUUID()
		const credentialID2 = randomUUID()
		const credentialID3 = randomUUID()
		await adapter.linkAccount({
			provider: 'webauthn',
			providerAccountId: credentialID1,
			type: 'webauthn',
			userId: user1.id,
		})
		await adapter.linkAccount({
			provider: 'webauthn',
			providerAccountId: credentialID2,
			type: 'webauthn',
			userId: user1.id,
		})
		await adapter.linkAccount({
			provider: 'webauthn',
			providerAccountId: credentialID3,
			type: 'webauthn',
			userId: user2.id,
		})
		const authenticator1 = await adapter.createAuthenticator({
			credentialID: credentialID1,
			providerAccountId: credentialID1,
			userId: user1.id,
			counter: randomInt(100),
			credentialBackedUp: true,
			credentialDeviceType: 'platform',
			credentialPublicKey: randomUUID(),
			transports: 'usb,ble,nfc',
		})
		const authenticator2 = await adapter.createAuthenticator({
			credentialID: credentialID2,
			providerAccountId: credentialID2,
			userId: user1.id,
			counter: randomInt(100),
			credentialBackedUp: true,
			credentialDeviceType: 'platform',
			credentialPublicKey: randomUUID(),
			transports: 'usb,nfc',
		})
		const authenticator3 = await adapter.createAuthenticator({
			credentialID: credentialID3,
			providerAccountId: credentialID3,
			userId: user2.id,
			counter: randomInt(100),
			credentialBackedUp: true,
			credentialDeviceType: 'platform',
			credentialPublicKey: randomUUID(),
			transports: 'usb,ble',
		})

		// Test
		const authenticators0 =
			await adapter.listAuthenticatorsByUserId('invalid-user-id')
		expect(authenticators0).toEqual([])

		const authenticators1 = await adapter.listAuthenticatorsByUserId(user1.id)
		expect(authenticators1).not.toBeNull()
		expect([authenticator1, authenticator2]).toMatchObject(
			authenticators1 || [],
		)

		const authenticators2 = await adapter.listAuthenticatorsByUserId(user2.id)
		expect(authenticators2).not.toBeNull()
		expect([authenticator3]).toMatchObject(authenticators2 || [])
	})
	maybeTest('updateAuthenticatorCounter', async () => {
		// Setup
		const credentialID = randomUUID()
		const localUser = await adapter.createUser({
			id: randomUUID(),
			email: 'updateAuthenticatorCounter@example.com',
			emailVerified: null,
		})
		await adapter.linkAccount({
			provider: 'webauthn',
			providerAccountId: credentialID,
			type: 'webauthn',
			userId: localUser.id,
		})
		const newAuthenticator = await adapter.createAuthenticator({
			credentialID,
			providerAccountId: credentialID,
			userId: localUser.id,
			counter: randomInt(100),
			credentialBackedUp: true,
			credentialDeviceType: 'platform',
			credentialPublicKey: randomUUID(),
			transports: 'usb,ble,nfc',
		})

		// Test
		await expect(() =>
			adapter.updateAuthenticatorCounter(
				'invalid-credential-id',
				randomInt(100),
			),
		).rejects.toThrow()

		const newCounter = newAuthenticator.counter + randomInt(100)
		const updatedAuthenticator = await adapter.updateAuthenticatorCounter(
			credentialID,
			newCounter,
		)
		expect(updatedAuthenticator).not.toBeNull()
		expect(updatedAuthenticator.counter).toBe(newCounter)
	})
}

// UTILS
export function hashToken(token: string) {
	return createHash('sha256').update(`${token}anything`).digest('hex')
}

export { randomUUID }

export const ONE_WEEK_FROM_NOW = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
export const FIFTEEN_MINUTES_FROM_NOW = new Date(Date.now() + 15 * 60 * 1000)
export const ONE_MONTH = 1000 * 60 * 60 * 24 * 30
export const ONE_MONTH_FROM_NOW = new Date(Date.now() + ONE_MONTH)
