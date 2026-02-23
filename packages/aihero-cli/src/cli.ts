#!/usr/bin/env node
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { Args, Command, Options } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Console, Effect } from 'effect'

type NextActionParam = {
	description?: string
	value?: string | number | boolean
	default?: string | number | boolean
	enum?: string[]
	required?: boolean
}

type NextAction = {
	command: string
	description: string
	params?: Record<string, NextActionParam>
}

type AppProfile = {
	baseUrl?: string
	token?: string
	tokenCreatedAt?: string
}

type AiheroConfig = {
	currentApp?: string
	apps?: Record<string, AppProfile>
}

type AppDefinition = {
	id: string
	displayName: string
	defaultBaseUrl: string
	auth: {
		deviceCodePath: string
		tokenPath: string
		userInfoPath: string
	} | null
	capabilities: {
		surveyApi: boolean
	}
	api: {
		surveysPath: string
		surveyAnalyticsPath: string
	}
}

type DeviceCodeResponse = {
	device_code: string
	user_code: string
	verification_uri: string
	verification_uri_complete: string
	expires_in: number
	interval: number
}

type TokenResponse = {
	access_token: string
	token_type: string
	scope?: string
}

type ResolvedContext = {
	appId: string
	app: AppDefinition
	baseUrl: string
	token?: string
}

class ApiRequestError extends Error {
	constructor(
		message: string,
		public status: number,
		public body: unknown,
	) {
		super(message)
	}
}

const CLI_NAME = 'aihero'
const CLI_VERSION = '0.2.0'
const DEFAULT_APP_ID = 'ai-hero'
const DEFAULT_BASE_URL = 'http://localhost:3000'

const KNOWN_APPS: Record<string, AppDefinition> = {
	'ai-hero': {
		id: 'ai-hero',
		displayName: 'AI Hero',
		defaultBaseUrl: DEFAULT_BASE_URL,
		auth: {
			deviceCodePath: '/oauth/device/code',
			tokenPath: '/oauth/token',
			userInfoPath: '/oauth/userinfo',
		},
		capabilities: {
			surveyApi: true,
		},
		api: {
			surveysPath: '/api/surveys',
			surveyAnalyticsPath: '/api/surveys/analytics',
		},
	},
}

const getConfigPath = () =>
	process.env.AIHERO_CONFIG_PATH ||
	path.join(os.homedir(), '.config', 'aihero', 'config.json')

const unwrapOption = <T>(value: unknown): T | undefined => {
	if (
		typeof value === 'object' &&
		value !== null &&
		'_tag' in value &&
		'value' in value &&
		(value as { _tag: string })._tag === 'Some'
	) {
		return (value as unknown as { value: T }).value
	}
	return undefined
}

const normalizeAppId = (value?: string) => value?.trim().toLowerCase()

const normalizeCommand = (command: string) => {
	const trimmed = command.trim()
	if (!trimmed) return CLI_NAME
	if (trimmed === CLI_NAME || trimmed.startsWith(`${CLI_NAME} `)) return trimmed
	return `${CLI_NAME} ${trimmed}`
}

const respond = (command: string, result: unknown, nextActions: NextAction[]) =>
	JSON.stringify(
		{
			ok: true,
			command: normalizeCommand(command),
			result,
			next_actions: nextActions.map((action) => ({
				...action,
				command: normalizeCommand(action.command),
			})),
		},
		null,
		2,
	)

const respondError = (
	command: string,
	message: string,
	code: string,
	fix: string,
	nextActions: NextAction[],
) =>
	JSON.stringify(
		{
			ok: false,
			command: normalizeCommand(command),
			result: null,
			error: {
				message,
				code,
			},
			fix,
			next_actions: nextActions.map((action) => ({
				...action,
				command: normalizeCommand(action.command),
			})),
		},
		null,
		2,
	)

const runAndPrint = (handler: () => Promise<string>) =>
	Effect.gen(function* () {
		const payload = yield* Effect.tryPromise(handler)
		yield* Console.log(payload)
	})

const getUnknownAppDefinition = (id: string): AppDefinition => ({
	id,
	displayName: id,
	defaultBaseUrl: DEFAULT_BASE_URL,
	auth: {
		deviceCodePath: '/oauth/device/code',
		tokenPath: '/oauth/token',
		userInfoPath: '/oauth/userinfo',
	},
	capabilities: {
		surveyApi: false,
	},
	api: {
		surveysPath: '/api/surveys',
		surveyAnalyticsPath: '/api/surveys/analytics',
	},
})

const getAppDefinition = (appId: string) =>
	KNOWN_APPS[appId] || getUnknownAppDefinition(appId)

const toRecord = (value: unknown): Record<string, unknown> => {
	if (typeof value === 'object' && value !== null) {
		return value as Record<string, unknown>
	}
	return {}
}

const normalizeProfile = (value: unknown): AppProfile => {
	const record = toRecord(value)
	const baseUrl =
		typeof record.baseUrl === 'string' ? record.baseUrl : undefined
	const token = typeof record.token === 'string' ? record.token : undefined
	const tokenCreatedAt =
		typeof record.tokenCreatedAt === 'string'
			? record.tokenCreatedAt
			: undefined
	return {
		...(baseUrl ? { baseUrl } : {}),
		...(token ? { token } : {}),
		...(tokenCreatedAt ? { tokenCreatedAt } : {}),
	}
}

const readConfig = async (): Promise<AiheroConfig> => {
	const configPath = getConfigPath()
	try {
		const raw = await fs.readFile(configPath, 'utf8')
		const parsed = JSON.parse(raw) as unknown
		const parsedRecord = toRecord(parsed)
		const appsRecord = toRecord(parsedRecord.apps)

		const apps = Object.fromEntries(
			Object.entries(appsRecord).map(([appId, profile]) => [
				appId,
				normalizeProfile(profile),
			]),
		)

		const legacyBaseUrl =
			typeof parsedRecord.baseUrl === 'string'
				? parsedRecord.baseUrl
				: undefined
		const legacyToken =
			typeof parsedRecord.token === 'string' ? parsedRecord.token : undefined
		const legacyTokenCreatedAt =
			typeof parsedRecord.tokenCreatedAt === 'string'
				? parsedRecord.tokenCreatedAt
				: undefined

		if ((legacyBaseUrl || legacyToken) && !apps[DEFAULT_APP_ID]) {
			apps[DEFAULT_APP_ID] = {
				...(legacyBaseUrl ? { baseUrl: legacyBaseUrl } : {}),
				...(legacyToken ? { token: legacyToken } : {}),
				...(legacyTokenCreatedAt
					? { tokenCreatedAt: legacyTokenCreatedAt }
					: {}),
			}
		}

		const currentAppRaw =
			typeof parsedRecord.currentApp === 'string'
				? parsedRecord.currentApp
				: undefined
		const currentApp =
			normalizeAppId(currentAppRaw) ||
			(Object.keys(apps).length > 0 ? Object.keys(apps)[0] : DEFAULT_APP_ID)

		return {
			currentApp,
			apps,
		}
	} catch {
		return {
			currentApp: DEFAULT_APP_ID,
			apps: {},
		}
	}
}

const writeConfig = async (config: AiheroConfig): Promise<void> => {
	const configPath = getConfigPath()
	await fs.mkdir(path.dirname(configPath), { recursive: true })

	const apps = Object.fromEntries(
		Object.entries(config.apps || {}).map(([appId, profile]) => {
			const normalized: AppProfile = {
				...(profile.baseUrl ? { baseUrl: profile.baseUrl } : {}),
				...(profile.token ? { token: profile.token } : {}),
				...(profile.tokenCreatedAt
					? { tokenCreatedAt: profile.tokenCreatedAt }
					: {}),
			}
			return [appId, normalized]
		}),
	)

	const normalized: AiheroConfig = {
		currentApp: normalizeAppId(config.currentApp) || DEFAULT_APP_ID,
		apps,
	}

	await fs.writeFile(configPath, JSON.stringify(normalized, null, 2), 'utf8')
}

const envSuffixForApp = (appId: string) =>
	appId.toUpperCase().replace(/[^A-Z0-9]/g, '_')

const resolveAppId = async (appFlag?: string) => {
	const config = await readConfig()
	return (
		normalizeAppId(appFlag) ||
		normalizeAppId(process.env.AIHERO_APP) ||
		normalizeAppId(config.currentApp) ||
		DEFAULT_APP_ID
	)
}

const resolveBaseUrl = async (appId: string, baseUrlFlag?: string) => {
	const config = await readConfig()
	const appProfile = config.apps?.[appId]
	const appSuffix = envSuffixForApp(appId)
	return (
		baseUrlFlag ||
		process.env[`AIHERO_BASE_URL_${appSuffix}`] ||
		process.env.AIHERO_BASE_URL ||
		appProfile?.baseUrl ||
		getAppDefinition(appId).defaultBaseUrl
	)
}

const resolveToken = async (appId: string, tokenFlag?: string) => {
	const config = await readConfig()
	const appProfile = config.apps?.[appId]
	const appSuffix = envSuffixForApp(appId)
	return (
		tokenFlag ||
		process.env[`AIHERO_AUTH_TOKEN_${appSuffix}`] ||
		process.env.AIHERO_AUTH_TOKEN ||
		process.env.AUTH_TOKEN ||
		appProfile?.token
	)
}

const saveAppSession = async ({
	appId,
	baseUrl,
	token,
}: {
	appId: string
	baseUrl: string
	token: string
}) => {
	const config = await readConfig()
	const existing = config.apps?.[appId] || {}

	await writeConfig({
		currentApp: appId,
		apps: {
			...(config.apps || {}),
			[appId]: {
				...existing,
				baseUrl,
				token,
				tokenCreatedAt: new Date().toISOString(),
			},
		},
	})
}

const clearAppToken = async (appId: string) => {
	const config = await readConfig()
	const existing = config.apps?.[appId] || {}

	await writeConfig({
		currentApp: config.currentApp || appId,
		apps: {
			...(config.apps || {}),
			[appId]: {
				...(existing.baseUrl ? { baseUrl: existing.baseUrl } : {}),
			},
		},
	})
}

const setCurrentApp = async (appId: string) => {
	const normalized = normalizeAppId(appId) || DEFAULT_APP_ID
	const config = await readConfig()
	await writeConfig({
		currentApp: normalized,
		apps: config.apps || {},
	})
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const requestApi = async <T>({
	baseUrl,
	pathname,
	method = 'GET',
	token,
	body,
	formBody,
}: {
	baseUrl: string
	pathname: string
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
	token?: string
	body?: unknown
	formBody?: URLSearchParams
}): Promise<T> => {
	const url = `${baseUrl}${pathname}`
	const headers = new Headers()
	headers.set('Accept', 'application/json')
	if (token) headers.set('Authorization', `Bearer ${token}`)

	let payload: string | URLSearchParams | undefined
	if (formBody) {
		payload = formBody
		headers.set('Content-Type', 'application/x-www-form-urlencoded')
	} else if (body !== undefined) {
		payload = JSON.stringify(body)
		headers.set('Content-Type', 'application/json')
	}

	const response = await fetch(url, {
		method,
		headers,
		body: payload,
	})

	const contentType = response.headers.get('content-type') || ''
	const rawText = await response.text()
	const parsedBody = rawText
		? contentType.includes('application/json')
			? (JSON.parse(rawText) as unknown)
			: rawText
		: null

	if (!response.ok) {
		const bodyMessage =
			typeof parsedBody === 'object' && parsedBody !== null
				? ((parsedBody as Record<string, unknown>)
						.error_description as string) ||
					((parsedBody as Record<string, unknown>).error as string) ||
					((parsedBody as Record<string, unknown>).message as string)
				: undefined
		throw new ApiRequestError(
			bodyMessage || `Request failed with status ${response.status}`,
			response.status,
			parsedBody,
		)
	}

	return parsedBody as T
}

const truncateArray = async <T>({
	items,
	label,
	max = 25,
}: {
	items: T[]
	label: string
	max?: number
}) => {
	if (items.length <= max) {
		return {
			items,
			total: items.length,
			truncated: false,
			fullOutputPath: null as string | null,
		}
	}

	const fullOutputPath = path.join(
		os.tmpdir(),
		`${CLI_NAME}-${label}-${Date.now()}.json`,
	)
	await fs.writeFile(fullOutputPath, JSON.stringify(items, null, 2), 'utf8')

	return {
		items: items.slice(0, max),
		total: items.length,
		truncated: true,
		fullOutputPath,
	}
}

const appOption = Options.text('app').pipe(
	Options.withAlias('a'),
	Options.withDescription(`Target app ID (default: ${DEFAULT_APP_ID})`),
	Options.optional,
)

const baseUrlOption = Options.text('base-url').pipe(
	Options.withAlias('u'),
	Options.withDescription(`App base URL (default: ${DEFAULT_BASE_URL})`),
	Options.optional,
)

const tokenOption = Options.text('token').pipe(
	Options.withAlias('t'),
	Options.withDescription('Bearer token (defaults to stored token for app)'),
	Options.optional,
)

const withContext = async ({
	app,
	baseUrl,
	token,
	command,
	requireToken,
	requireSurveyApi,
}: {
	app: unknown
	baseUrl: unknown
	token: unknown
	command: string
	requireToken?: boolean
	requireSurveyApi?: boolean
}): Promise<
	{ ok: true; context: ResolvedContext } | { ok: false; payload: string }
> => {
	const appId = await resolveAppId(unwrapOption<string>(app))
	const appDefinition = getAppDefinition(appId)
	const resolvedBaseUrl = await resolveBaseUrl(
		appId,
		unwrapOption<string>(baseUrl),
	)
	const resolvedToken = await resolveToken(appId, unwrapOption<string>(token))

	if (requireSurveyApi && !appDefinition.capabilities.surveyApi) {
		return {
			ok: false,
			payload: respondError(
				command,
				`App '${appId}' does not expose survey API endpoints`,
				'APP_CAPABILITY_MISSING',
				`Switch to an app with survey API support (for now: 'ai-hero') or implement API endpoints for '${appId}'.`,
				[
					{
						command: 'app list',
						description: 'List available app profiles and capabilities',
					},
					{
						command: 'app use <app-id>',
						description: 'Set active app profile',
						params: {
							'app-id': {
								required: true,
								value: DEFAULT_APP_ID,
							},
						},
					},
				],
			),
		}
	}

	if (requireToken && !resolvedToken) {
		return {
			ok: false,
			payload: respondError(
				command,
				`No auth token found for app '${appId}'`,
				'AUTH_REQUIRED',
				`Run \`aihero auth login --app ${appId}\` to authenticate this app profile.`,
				[
					{
						command: 'auth login [--app <app-id>] [--base-url <url>]',
						description: 'Authenticate the app profile via OAuth device flow',
						params: {
							'app-id': {
								value: appId,
								required: true,
							},
							url: {
								value: resolvedBaseUrl,
							},
						},
					},
				],
			),
		}
	}

	return {
		ok: true,
		context: {
			appId,
			app: appDefinition,
			baseUrl: resolvedBaseUrl,
			token: resolvedToken,
		},
	}
}

const parseAppFromArgs = async (app: unknown, baseUrl: unknown) => {
	const appId = await resolveAppId(unwrapOption<string>(app))
	const appDefinition = getAppDefinition(appId)
	const resolvedBaseUrl = await resolveBaseUrl(
		appId,
		unwrapOption<string>(baseUrl),
	)
	return {
		appId,
		appDefinition,
		resolvedBaseUrl,
	}
}

const appListCommand = Command.make('list', {}, () =>
	runAndPrint(async () => {
		const config = await readConfig()
		const currentApp = normalizeAppId(config.currentApp) || DEFAULT_APP_ID
		const knownIds = Object.keys(KNOWN_APPS)
		const configuredIds = Object.keys(config.apps || {})
		const allIds = Array.from(new Set([...knownIds, ...configuredIds])).sort()

		const apps = allIds.map((appId) => {
			const app = getAppDefinition(appId)
			const profile = config.apps?.[appId]
			return {
				id: appId,
				display_name: app.displayName,
				is_known: Boolean(KNOWN_APPS[appId]),
				is_current: appId === currentApp,
				capabilities: app.capabilities,
				base_url: profile?.baseUrl || app.defaultBaseUrl,
				has_token: Boolean(profile?.token),
				token_created_at: profile?.tokenCreatedAt || null,
			}
		})

		return respond(
			'app list',
			{
				current_app: currentApp,
				apps,
				config_path: getConfigPath(),
			},
			[
				{
					command: 'app use <app-id>',
					description: 'Switch active app profile',
					params: {
						'app-id': {
							required: true,
							value: currentApp,
						},
					},
				},
				{
					command: 'auth login [--app <app-id>]',
					description: 'Login for a specific app profile',
					params: {
						'app-id': {
							value: currentApp,
							required: true,
						},
					},
				},
			],
		)
	}),
).pipe(Command.withDescription('List configured app profiles and capabilities'))

const appUseCommand = Command.make(
	'use',
	{
		appId: Args.text({ name: 'app-id' }).pipe(
			Args.withDescription('App ID (e.g. ai-hero)'),
		),
	},
	({ appId }) =>
		runAndPrint(async () => {
			const normalizedAppId = normalizeAppId(appId)
			if (!normalizedAppId) {
				return respondError(
					`app use ${appId}`,
					'Invalid app-id',
					'INVALID_APP_ID',
					'Provide a non-empty app identifier (for example: ai-hero).',
					[],
				)
			}

			await setCurrentApp(normalizedAppId)
			const appDefinition = getAppDefinition(normalizedAppId)

			return respond(
				`app use ${normalizedAppId}`,
				{
					current_app: normalizedAppId,
					display_name: appDefinition.displayName,
					is_known: Boolean(KNOWN_APPS[normalizedAppId]),
					capabilities: appDefinition.capabilities,
					config_path: getConfigPath(),
				},
				[
					{
						command: 'app current',
						description: 'Show current app profile',
					},
					{
						command: 'auth login [--app <app-id>]',
						description: 'Authenticate the active app',
						params: {
							'app-id': {
								value: normalizedAppId,
								required: true,
							},
						},
					},
				],
			)
		}),
).pipe(Command.withDescription('Set the active app profile'))

const appCurrentCommand = Command.make('current', {}, () =>
	runAndPrint(async () => {
		const config = await readConfig()
		const currentApp = normalizeAppId(config.currentApp) || DEFAULT_APP_ID
		const app = getAppDefinition(currentApp)
		const profile = config.apps?.[currentApp]

		return respond(
			'app current',
			{
				current_app: currentApp,
				display_name: app.displayName,
				is_known: Boolean(KNOWN_APPS[currentApp]),
				capabilities: app.capabilities,
				base_url: profile?.baseUrl || app.defaultBaseUrl,
				has_token: Boolean(profile?.token),
				token_created_at: profile?.tokenCreatedAt || null,
				config_path: getConfigPath(),
			},
			[
				{
					command: 'auth login [--app <app-id>]',
					description: 'Authenticate this app profile',
					params: {
						'app-id': {
							value: currentApp,
							required: true,
						},
					},
				},
			],
		)
	}),
).pipe(Command.withDescription('Show active app profile'))

const appCommand = Command.make('app', {}, () =>
	runAndPrint(async () => {
		return respond(
			'app',
			{
				description: 'App profile commands',
				commands: [
					{
						name: 'list',
						description: 'List app profiles and capabilities',
						usage: 'aihero app list',
					},
					{
						name: 'current',
						description: 'Show current app profile',
						usage: 'aihero app current',
					},
					{
						name: 'use',
						description: 'Set current app profile',
						usage: 'aihero app use <app-id>',
					},
				],
			},
			[
				{
					command: 'app list',
					description: 'List available app profiles',
				},
			],
		)
	}),
).pipe(
	Command.withSubcommands([appListCommand, appCurrentCommand, appUseCommand]),
	Command.withDescription('Manage app profiles (per-app auth + base URLs)'),
)

const authLoginCommand = Command.make(
	'login',
	{
		app: appOption,
		baseUrl: baseUrlOption,
		noPoll: Options.boolean('no-poll').pipe(
			Options.withDescription(
				'Do not poll for token; only print verification URL',
			),
			Options.withDefault(false),
		),
		interval: Options.integer('interval').pipe(
			Options.withDescription(
				'Polling interval in seconds (default: server interval)',
			),
			Options.optional,
		),
		timeout: Options.integer('timeout').pipe(
			Options.withDescription(
				'Maximum wait time in seconds (default: server expires_in)',
			),
			Options.optional,
		),
	},
	({ app, baseUrl, noPoll, interval, timeout }) =>
		runAndPrint(async () => {
			const { appId, appDefinition, resolvedBaseUrl } = await parseAppFromArgs(
				app,
				baseUrl,
			)
			const intervalOverride = unwrapOption<number>(interval)
			const timeoutOverride = unwrapOption<number>(timeout)

			if (!appDefinition.auth) {
				return respondError(
					'auth login',
					`App '${appId}' does not expose OAuth device endpoints`,
					'AUTH_UNSUPPORTED',
					`Provide app-specific auth endpoints in the CLI registry before attempting device login for '${appId}'.`,
					[
						{
							command: 'app list',
							description: 'Inspect configured app capabilities',
						},
					],
				)
			}

			try {
				const deviceCode = await requestApi<DeviceCodeResponse>({
					baseUrl: resolvedBaseUrl,
					pathname: appDefinition.auth.deviceCodePath,
					method: 'POST',
				})

				if (noPoll) {
					return respond(
						'auth login --no-poll',
						{
							app: appId,
							base_url: resolvedBaseUrl,
							status: 'verification-required',
							user_code: deviceCode.user_code,
							verification_uri: deviceCode.verification_uri,
							verification_uri_complete: deviceCode.verification_uri_complete,
							expires_in: deviceCode.expires_in,
							polling_interval: deviceCode.interval,
						},
						[
							{
								command: 'auth login [--app <app-id>] [--base-url <url>]',
								description:
									'Start login again and poll for token automatically',
								params: {
									'app-id': {
										value: appId,
										required: true,
									},
									url: {
										value: resolvedBaseUrl,
									},
								},
							},
						],
					)
				}

				const pollingInterval = Math.max(
					1,
					intervalOverride ?? deviceCode.interval ?? 5,
				)
				const timeoutSeconds = Math.max(
					5,
					timeoutOverride ?? deviceCode.expires_in ?? 600,
				)
				const deadline = Date.now() + timeoutSeconds * 1000

				let attempts = 0
				let tokenResponse: TokenResponse | null = null

				while (Date.now() < deadline) {
					attempts += 1
					await sleep(pollingInterval * 1000)

					try {
						tokenResponse = await requestApi<TokenResponse>({
							baseUrl: resolvedBaseUrl,
							pathname: appDefinition.auth.tokenPath,
							method: 'POST',
							formBody: new URLSearchParams({
								device_code: deviceCode.device_code,
							}),
						})
						break
					} catch (error) {
						if (error instanceof ApiRequestError) {
							const body = toRecord(error.body)
							const oauthError =
								typeof body.error === 'string' ? body.error : null
							if (oauthError === 'authorization_pending') {
								continue
							}
							if (oauthError === 'expired_token') {
								return respondError(
									'auth login',
									'Device code expired before verification completed',
									'DEVICE_CODE_EXPIRED',
									'Run `aihero auth login` again to generate a new code.',
									[
										{
											command: 'auth login [--app <app-id>] [--base-url <url>]',
											description: 'Start a fresh device login flow',
											params: {
												'app-id': {
													value: appId,
													required: true,
												},
												url: {
													value: resolvedBaseUrl,
												},
											},
										},
									],
								)
							}
							if (oauthError === 'access_denied') {
								return respondError(
									'auth login',
									'Access denied during device token exchange',
									'ACCESS_DENIED',
									'Complete verification with the displayed user code, then retry.',
									[
										{
											command: 'auth login [--app <app-id>] [--base-url <url>]',
											description: 'Retry device login',
											params: {
												'app-id': {
													value: appId,
													required: true,
												},
												url: {
													value: resolvedBaseUrl,
												},
											},
										},
									],
								)
							}
						}

						return respondError(
							'auth login',
							error instanceof Error ? error.message : 'Token polling failed',
							'AUTH_POLL_FAILED',
							'Ensure the server is reachable and retry `aihero auth login`.',
							[
								{
									command: 'auth login [--app <app-id>] [--base-url <url>]',
									description: 'Retry authentication',
									params: {
										'app-id': {
											value: appId,
											required: true,
										},
										url: {
											value: resolvedBaseUrl,
										},
									},
								},
							],
						)
					}
				}

				if (!tokenResponse?.access_token) {
					return respondError(
						'auth login',
						'Timed out waiting for device verification',
						'AUTH_TIMEOUT',
						'Open the verification URL, complete login, then rerun `aihero auth login`.',
						[
							{
								command: 'auth login [--app <app-id>] [--base-url <url>]',
								description: 'Start login and poll again',
								params: {
									'app-id': {
										value: appId,
										required: true,
									},
									url: {
										value: resolvedBaseUrl,
									},
								},
							},
						],
					)
				}

				await saveAppSession({
					appId,
					baseUrl: resolvedBaseUrl,
					token: tokenResponse.access_token,
				})

				let user: unknown = null
				try {
					user = await requestApi<unknown>({
						baseUrl: resolvedBaseUrl,
						pathname: appDefinition.auth.userInfoPath,
						method: 'GET',
						token: tokenResponse.access_token,
					})
				} catch {
					user = null
				}

				return respond(
					'auth login',
					{
						app: appId,
						status: 'authenticated',
						base_url: resolvedBaseUrl,
						user_code: deviceCode.user_code,
						verification_uri: deviceCode.verification_uri,
						verification_uri_complete: deviceCode.verification_uri_complete,
						poll_attempts: attempts,
						token_type: tokenResponse.token_type,
						scope: tokenResponse.scope || null,
						config_path: getConfigPath(),
						user,
					},
					[
						{
							command:
								'auth whoami [--app <app-id>] [--base-url <url>] [--token <token>]',
							description: 'Confirm active authenticated user',
							params: {
								'app-id': {
									value: appId,
									required: true,
								},
								url: {
									value: resolvedBaseUrl,
								},
							},
						},
						{
							command:
								'survey list [--app <app-id>] [--search <text>] [--base-url <url>] [--token <token>]',
							description: 'List surveys for the app (if supported)',
							params: {
								'app-id': {
									value: appId,
									required: true,
								},
							},
						},
					],
				)
			} catch (error) {
				return respondError(
					'auth login',
					error instanceof Error
						? error.message
						: 'Failed to start device flow',
					'AUTH_INIT_FAILED',
					'Ensure the app is running and reachable, then retry.',
					[
						{
							command: 'auth login [--app <app-id>] [--base-url <url>]',
							description: 'Retry device login',
							params: {
								'app-id': {
									value: appId,
									required: true,
								},
								url: {
									value: resolvedBaseUrl,
								},
							},
						},
					],
				)
			}
		}),
).pipe(
	Command.withDescription(
		'Authenticate with OAuth device flow (headless-friendly)',
	),
)

const authWhoamiCommand = Command.make(
	'whoami',
	{
		app: appOption,
		baseUrl: baseUrlOption,
		token: tokenOption,
	},
	({ app, baseUrl, token }) =>
		runAndPrint(async () => {
			const resolved = await withContext({
				app,
				baseUrl,
				token,
				command: 'auth whoami',
				requireToken: true,
			})
			if (!resolved.ok) return resolved.payload

			if (!resolved.context.app.auth) {
				return respondError(
					'auth whoami',
					`App '${resolved.context.appId}' does not expose a userinfo endpoint`,
					'AUTH_UNSUPPORTED',
					'Select an app profile with OAuth support or provide app-specific endpoint mapping.',
					[
						{
							command: 'app list',
							description: 'Inspect app capabilities',
						},
					],
				)
			}

			try {
				const user = await requestApi<unknown>({
					baseUrl: resolved.context.baseUrl,
					pathname: resolved.context.app.auth.userInfoPath,
					method: 'GET',
					token: resolved.context.token,
				})

				return respond(
					'auth whoami',
					{
						app: resolved.context.appId,
						base_url: resolved.context.baseUrl,
						user,
					},
					[
						{
							command: 'survey list [--app <app-id>]',
							description: 'List surveys for this app (if supported)',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
						{
							command: 'auth logout [--app <app-id>]',
							description: 'Clear stored auth token for this app',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			} catch (error) {
				return respondError(
					'auth whoami',
					error instanceof Error ? error.message : 'Failed to fetch user info',
					'AUTH_WHOAMI_FAILED',
					'Run `aihero auth login` to refresh the token.',
					[
						{
							command: 'auth login [--app <app-id>] [--base-url <url>]',
							description: 'Authenticate again',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
								url: {
									value: resolved.context.baseUrl,
								},
							},
						},
					],
				)
			}
		}),
).pipe(
	Command.withDescription('Show current user from OAuth userinfo endpoint'),
)

const authLogoutCommand = Command.make(
	'logout',
	{
		app: appOption,
	},
	({ app }) =>
		runAndPrint(async () => {
			const appId = await resolveAppId(unwrapOption<string>(app))
			await clearAppToken(appId)
			return respond(
				'auth logout',
				{
					app: appId,
					status: 'logged_out',
					config_path: getConfigPath(),
				},
				[
					{
						command: 'auth login [--app <app-id>]',
						description: 'Login again for this app profile',
						params: {
							'app-id': {
								value: appId,
								required: true,
							},
						},
					},
				],
			)
		}),
).pipe(Command.withDescription('Clear stored auth token from local config'))

const authCommand = Command.make('auth', {}, () =>
	runAndPrint(async () =>
		respond(
			'auth',
			{
				description: 'Authentication commands for app OAuth device flow',
				commands: [
					{
						name: 'login',
						description: 'Start device login, print URL, and poll for token',
						usage:
							'aihero auth login [--app <app-id>] [--base-url <url>] [--interval <seconds>]',
					},
					{
						name: 'whoami',
						description: 'Get current user profile from token',
						usage:
							'aihero auth whoami [--app <app-id>] [--base-url <url>] [--token <token>]',
					},
					{
						name: 'logout',
						description: 'Clear stored token for app profile',
						usage: 'aihero auth logout [--app <app-id>]',
					},
				],
			},
			[
				{
					command: 'auth login [--app <app-id>]',
					description: 'Start device login flow',
					params: {
						'app-id': {
							value: DEFAULT_APP_ID,
							required: true,
						},
					},
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([
		authLoginCommand,
		authWhoamiCommand,
		authLogoutCommand,
	]),
	Command.withDescription('Authentication helpers'),
)

const surveyListCommand = Command.make(
	'list',
	{
		app: appOption,
		search: Options.text('search').pipe(
			Options.withDescription('Filter by title/slug'),
			Options.optional,
		),
		baseUrl: baseUrlOption,
		token: tokenOption,
	},
	({ app, search, baseUrl, token }) =>
		runAndPrint(async () => {
			const resolved = await withContext({
				app,
				baseUrl,
				token,
				command: 'survey list',
				requireToken: true,
				requireSurveyApi: true,
			})
			if (!resolved.ok) return resolved.payload

			try {
				const searchValue = unwrapOption<string>(search)
				const query = searchValue
					? `?search=${encodeURIComponent(searchValue)}`
					: ''
				const surveys = await requestApi<unknown[]>({
					baseUrl: resolved.context.baseUrl,
					pathname: `${resolved.context.app.api.surveysPath}${query}`,
					method: 'GET',
					token: resolved.context.token,
				})

				const compact = surveys.map((survey) => {
					const record = toRecord(survey)
					const fields = toRecord(record.fields)
					const resources = Array.isArray(record.resources)
						? record.resources
						: []
					return {
						id: typeof record.id === 'string' ? record.id : null,
						title:
							typeof fields.title === 'string'
								? fields.title
								: 'Untitled Survey',
						slug: typeof fields.slug === 'string' ? fields.slug : null,
						state: typeof fields.state === 'string' ? fields.state : 'draft',
						visibility:
							typeof fields.visibility === 'string'
								? fields.visibility
								: 'unlisted',
						questionCount: resources.length,
						createdAt:
							typeof record.createdAt === 'string' ? record.createdAt : null,
					}
				})

				const truncated = await truncateArray({
					items: compact,
					label: `surveys-${resolved.context.appId}`,
					max: 40,
				})

				return respond(
					'survey list',
					{
						app: resolved.context.appId,
						total: truncated.total,
						truncated: truncated.truncated,
						...(truncated.fullOutputPath && {
							full_output: truncated.fullOutputPath,
						}),
						surveys: truncated.items,
					},
					[
						{
							command: 'survey get <slug-or-id> [--app <app-id>]',
							description: 'Get full survey details',
							params: {
								'slug-or-id': {
									description: 'Survey slug or ID',
									required: true,
								},
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
						{
							command: 'survey create <title> [--app <app-id>] [--slug <slug>]',
							description: 'Create a new survey',
							params: {
								title: {
									description: 'Survey title',
									required: true,
								},
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			} catch (error) {
				return respondError(
					'survey list',
					error instanceof Error ? error.message : 'Failed to list surveys',
					'SURVEY_LIST_FAILED',
					'Verify authentication and API availability, then retry.',
					[
						{
							command: 'auth whoami [--app <app-id>]',
							description: 'Validate current token',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			}
		}),
).pipe(Command.withDescription('List surveys (admin API)'))

const surveyGetCommand = Command.make(
	'get',
	{
		app: appOption,
		slugOrId: Args.text({ name: 'slug-or-id' }).pipe(
			Args.withDescription('Survey slug or ID'),
		),
		baseUrl: baseUrlOption,
		token: tokenOption,
	},
	({ app, slugOrId, baseUrl, token }) =>
		runAndPrint(async () => {
			const resolved = await withContext({
				app,
				baseUrl,
				token,
				command: 'survey get',
				requireToken: true,
				requireSurveyApi: true,
			})
			if (!resolved.ok) return resolved.payload

			try {
				const survey = await requestApi<unknown>({
					baseUrl: resolved.context.baseUrl,
					pathname: `${resolved.context.app.api.surveysPath}?slugOrId=${encodeURIComponent(slugOrId)}`,
					method: 'GET',
					token: resolved.context.token,
				})

				const surveyRecord = toRecord(survey)
				const fields = toRecord(surveyRecord.fields)
				const preferredSlugOrId =
					typeof fields.slug === 'string'
						? fields.slug
						: typeof surveyRecord.id === 'string'
							? surveyRecord.id
							: slugOrId

				return respond(
					`survey get ${slugOrId}`,
					{
						app: resolved.context.appId,
						survey,
					},
					[
						{
							command: 'survey analytics <slug-or-id> [--app <app-id>]',
							description: 'Get aggregate survey analytics',
							params: {
								'slug-or-id': {
									description: 'Survey slug or ID',
									value: preferredSlugOrId,
									required: true,
								},
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
						{
							command:
								'survey update <id> [--app <app-id>] [--title <title>] [--slug <slug>] [--state <state>] [--visibility <visibility>]',
							description: 'Update this survey',
							params: {
								id: {
									description: 'Survey ID',
									value:
										typeof surveyRecord.id === 'string'
											? surveyRecord.id
											: undefined,
									required: true,
								},
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			} catch (error) {
				return respondError(
					`survey get ${slugOrId}`,
					error instanceof Error ? error.message : 'Failed to fetch survey',
					'SURVEY_GET_FAILED',
					'Check the slug/ID and permissions, then retry.',
					[
						{
							command: 'survey list [--app <app-id>]',
							description: 'List available surveys',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			}
		}),
).pipe(Command.withDescription('Get a survey by slug or ID'))

const surveyCreateCommand = Command.make(
	'create',
	{
		app: appOption,
		title: Args.text({ name: 'title' }).pipe(
			Args.withDescription('Survey title'),
		),
		slug: Options.text('slug').pipe(
			Options.withDescription('Optional URL slug'),
			Options.optional,
		),
		state: Options.text('state').pipe(
			Options.withDescription("Survey state: 'draft' or 'published'"),
			Options.optional,
		),
		visibility: Options.text('visibility').pipe(
			Options.withDescription("Visibility: 'public', 'private', or 'unlisted'"),
			Options.optional,
		),
		baseUrl: baseUrlOption,
		token: tokenOption,
	},
	({ app, title, slug, state, visibility, baseUrl, token }) =>
		runAndPrint(async () => {
			const resolved = await withContext({
				app,
				baseUrl,
				token,
				command: 'survey create',
				requireToken: true,
				requireSurveyApi: true,
			})
			if (!resolved.ok) return resolved.payload

			const stateValue = unwrapOption<string>(state)
			const visibilityValue = unwrapOption<string>(visibility)
			const validStates = ['draft', 'published']
			const validVisibility = ['public', 'private', 'unlisted']

			if (stateValue && !validStates.includes(stateValue)) {
				return respondError(
					'survey create',
					`Invalid state '${stateValue}'`,
					'INVALID_STATE',
					`Use one of: ${validStates.join(', ')}`,
					[],
				)
			}

			if (visibilityValue && !validVisibility.includes(visibilityValue)) {
				return respondError(
					'survey create',
					`Invalid visibility '${visibilityValue}'`,
					'INVALID_VISIBILITY',
					`Use one of: ${validVisibility.join(', ')}`,
					[],
				)
			}

			try {
				const slugValue = unwrapOption<string>(slug)
				const payload = {
					title,
					...(slugValue && { slug: slugValue }),
					...(stateValue && { state: stateValue }),
					...(visibilityValue && { visibility: visibilityValue }),
				}

				const survey = await requestApi<unknown>({
					baseUrl: resolved.context.baseUrl,
					pathname: resolved.context.app.api.surveysPath,
					method: 'POST',
					token: resolved.context.token,
					body: payload,
				})

				const surveyRecord = toRecord(survey)
				const fields = toRecord(surveyRecord.fields)
				const preferredSlugOrId =
					typeof fields.slug === 'string'
						? fields.slug
						: typeof surveyRecord.id === 'string'
							? surveyRecord.id
							: undefined

				return respond(
					'survey create',
					{
						app: resolved.context.appId,
						survey,
					},
					[
						{
							command: 'survey get <slug-or-id> [--app <app-id>]',
							description: 'Fetch this survey',
							params: {
								'slug-or-id': {
									description: 'Survey slug or ID',
									value: preferredSlugOrId,
									required: true,
								},
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
						{
							command: 'survey analytics <slug-or-id> [--app <app-id>]',
							description: 'View analytics for this survey',
							params: {
								'slug-or-id': {
									description: 'Survey slug or ID',
									value: preferredSlugOrId,
									required: true,
								},
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			} catch (error) {
				return respondError(
					'survey create',
					error instanceof Error ? error.message : 'Failed to create survey',
					'SURVEY_CREATE_FAILED',
					'Verify input values and permissions, then retry.',
					[
						{
							command: 'survey list [--app <app-id>]',
							description: 'List existing surveys',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			}
		}),
).pipe(Command.withDescription('Create a new survey'))

const surveyUpdateCommand = Command.make(
	'update',
	{
		app: appOption,
		id: Args.text({ name: 'id' }).pipe(Args.withDescription('Survey ID')),
		title: Options.text('title').pipe(Options.optional),
		slug: Options.text('slug').pipe(Options.optional),
		state: Options.text('state').pipe(Options.optional),
		visibility: Options.text('visibility').pipe(Options.optional),
		baseUrl: baseUrlOption,
		token: tokenOption,
	},
	({ app, id, title, slug, state, visibility, baseUrl, token }) =>
		runAndPrint(async () => {
			const resolved = await withContext({
				app,
				baseUrl,
				token,
				command: `survey update ${id}`,
				requireToken: true,
				requireSurveyApi: true,
			})
			if (!resolved.ok) return resolved.payload

			const titleValue = unwrapOption<string>(title)
			const slugValue = unwrapOption<string>(slug)
			const stateValue = unwrapOption<string>(state)
			const visibilityValue = unwrapOption<string>(visibility)

			const validStates = ['draft', 'published']
			const validVisibility = ['public', 'private', 'unlisted']
			if (stateValue && !validStates.includes(stateValue)) {
				return respondError(
					`survey update ${id}`,
					`Invalid state '${stateValue}'`,
					'INVALID_STATE',
					`Use one of: ${validStates.join(', ')}`,
					[],
				)
			}
			if (visibilityValue && !validVisibility.includes(visibilityValue)) {
				return respondError(
					`survey update ${id}`,
					`Invalid visibility '${visibilityValue}'`,
					'INVALID_VISIBILITY',
					`Use one of: ${validVisibility.join(', ')}`,
					[],
				)
			}

			const payload = {
				id,
				...(titleValue !== undefined && { title: titleValue }),
				...(slugValue !== undefined && { slug: slugValue }),
				...(stateValue !== undefined && { state: stateValue }),
				...(visibilityValue !== undefined && { visibility: visibilityValue }),
			}

			if (Object.keys(payload).length === 1) {
				return respondError(
					`survey update ${id}`,
					'No update fields provided',
					'NO_CHANGES',
					'Provide at least one field: --title, --slug, --state, or --visibility.',
					[],
				)
			}

			try {
				const survey = await requestApi<unknown>({
					baseUrl: resolved.context.baseUrl,
					pathname: resolved.context.app.api.surveysPath,
					method: 'PATCH',
					token: resolved.context.token,
					body: payload,
				})

				const surveyRecord = toRecord(survey)
				const fields = toRecord(surveyRecord.fields)
				const preferredSlugOrId =
					typeof fields.slug === 'string'
						? fields.slug
						: typeof surveyRecord.id === 'string'
							? surveyRecord.id
							: id

				return respond(
					`survey update ${id}`,
					{
						app: resolved.context.appId,
						survey,
					},
					[
						{
							command: 'survey get <slug-or-id> [--app <app-id>]',
							description: 'Fetch updated survey',
							params: {
								'slug-or-id': {
									description: 'Survey slug or ID',
									value: preferredSlugOrId,
									required: true,
								},
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
						{
							command: 'survey analytics <slug-or-id> [--app <app-id>]',
							description: 'Review updated survey analytics',
							params: {
								'slug-or-id': {
									description: 'Survey slug or ID',
									value: preferredSlugOrId,
									required: true,
								},
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			} catch (error) {
				return respondError(
					`survey update ${id}`,
					error instanceof Error ? error.message : 'Failed to update survey',
					'SURVEY_UPDATE_FAILED',
					'Check survey ID, input values, and permissions, then retry.',
					[
						{
							command: 'survey list [--app <app-id>]',
							description: 'List surveys and confirm IDs',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			}
		}),
).pipe(Command.withDescription('Update survey fields'))

const surveyDeleteCommand = Command.make(
	'delete',
	{
		app: appOption,
		id: Args.text({ name: 'id' }).pipe(Args.withDescription('Survey ID')),
		baseUrl: baseUrlOption,
		token: tokenOption,
	},
	({ app, id, baseUrl, token }) =>
		runAndPrint(async () => {
			const resolved = await withContext({
				app,
				baseUrl,
				token,
				command: `survey delete ${id}`,
				requireToken: true,
				requireSurveyApi: true,
			})
			if (!resolved.ok) return resolved.payload

			try {
				const result = await requestApi<unknown>({
					baseUrl: resolved.context.baseUrl,
					pathname: `${resolved.context.app.api.surveysPath}?id=${encodeURIComponent(id)}`,
					method: 'DELETE',
					token: resolved.context.token,
				})

				return respond(
					`survey delete ${id}`,
					{
						app: resolved.context.appId,
						result,
					},
					[
						{
							command: 'survey list [--app <app-id>]',
							description: 'List remaining surveys',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			} catch (error) {
				return respondError(
					`survey delete ${id}`,
					error instanceof Error ? error.message : 'Failed to delete survey',
					'SURVEY_DELETE_FAILED',
					'Verify the ID and permissions, then retry.',
					[
						{
							command: 'survey list [--app <app-id>]',
							description: 'List surveys and confirm IDs',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			}
		}),
).pipe(Command.withDescription('Delete a survey'))

const surveyAnalyticsCommand = Command.make(
	'analytics',
	{
		app: appOption,
		slugOrId: Args.text({ name: 'slug-or-id' }).pipe(
			Args.withDescription('Survey slug or ID'),
		),
		baseUrl: baseUrlOption,
		token: tokenOption,
	},
	({ app, slugOrId, baseUrl, token }) =>
		runAndPrint(async () => {
			const resolved = await withContext({
				app,
				baseUrl,
				token,
				command: `survey analytics ${slugOrId}`,
				requireToken: true,
				requireSurveyApi: true,
			})
			if (!resolved.ok) return resolved.payload

			try {
				const analytics = await requestApi<unknown>({
					baseUrl: resolved.context.baseUrl,
					pathname: `${resolved.context.app.api.surveyAnalyticsPath}?slugOrId=${encodeURIComponent(slugOrId)}`,
					method: 'GET',
					token: resolved.context.token,
				})

				const analyticsRecord = toRecord(analytics)
				const recentResponses = Array.isArray(analyticsRecord.recentResponses)
					? analyticsRecord.recentResponses
					: []
				const truncatedRecent = await truncateArray({
					items: recentResponses,
					label: `survey-analytics-${resolved.context.appId}-${slugOrId}`,
					max: 25,
				})

				return respond(
					`survey analytics ${slugOrId}`,
					{
						app: resolved.context.appId,
						...analyticsRecord,
						recentResponses: truncatedRecent.items,
						recentResponsesTotal: truncatedRecent.total,
						recentResponsesTruncated: truncatedRecent.truncated,
						...(truncatedRecent.fullOutputPath && {
							recentResponsesFullOutput: truncatedRecent.fullOutputPath,
						}),
					},
					[
						{
							command: 'survey get <slug-or-id> [--app <app-id>]',
							description: 'Inspect survey definition',
							params: {
								'slug-or-id': {
									description: 'Survey slug or ID',
									value: slugOrId,
									required: true,
								},
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
						{
							command:
								'survey list [--app <app-id>] [--search <text>] [--base-url <url>] [--token <token>]',
							description: 'Return to survey list',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			} catch (error) {
				return respondError(
					`survey analytics ${slugOrId}`,
					error instanceof Error ? error.message : 'Failed to fetch analytics',
					'SURVEY_ANALYTICS_FAILED',
					'Check survey slug/ID and permissions, then retry.',
					[
						{
							command: 'survey list [--app <app-id>]',
							description: 'List surveys and choose a valid slug/ID',
							params: {
								'app-id': {
									value: resolved.context.appId,
									required: true,
								},
							},
						},
					],
				)
			}
		}),
).pipe(Command.withDescription('Get survey analytics'))

const surveyCommand = Command.make('survey', {}, () =>
	runAndPrint(async () =>
		respond(
			'survey',
			{
				description:
					'Survey CRUD and analytics commands (app capability-gated)',
				commands: [
					{
						name: 'list',
						description: 'List surveys',
						usage: 'aihero survey list [--app <app-id>] [--search <text>]',
					},
					{
						name: 'get',
						description: 'Get a survey by slug or ID',
						usage: 'aihero survey get <slug-or-id> [--app <app-id>]',
					},
					{
						name: 'create',
						description: 'Create a survey',
						usage:
							'aihero survey create <title> [--app <app-id>] [--slug <slug>]',
					},
					{
						name: 'update',
						description: 'Update a survey',
						usage:
							'aihero survey update <id> [--app <app-id>] [--title <title>] [--state <state>] [--visibility <visibility>]',
					},
					{
						name: 'delete',
						description: 'Delete a survey',
						usage: 'aihero survey delete <id> [--app <app-id>]',
					},
					{
						name: 'analytics',
						description: 'Get survey analytics',
						usage: 'aihero survey analytics <slug-or-id> [--app <app-id>]',
					},
				],
			},
			[
				{
					command: 'survey list [--app <app-id>]',
					description: 'List surveys',
					params: {
						'app-id': {
							value: DEFAULT_APP_ID,
							required: true,
						},
					},
				},
				{
					command: 'survey create <title> [--app <app-id>]',
					description: 'Create a new survey',
					params: {
						title: {
							description: 'Survey title',
							required: true,
						},
						'app-id': {
							value: DEFAULT_APP_ID,
							required: true,
						},
					},
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([
		surveyListCommand,
		surveyGetCommand,
		surveyCreateCommand,
		surveyUpdateCommand,
		surveyDeleteCommand,
		surveyAnalyticsCommand,
	]),
	Command.withDescription('Survey CRUD and analytics'),
)

const root = Command.make(CLI_NAME, {}, () =>
	runAndPrint(async () => {
		const config = await readConfig()
		const currentApp = normalizeAppId(config.currentApp) || DEFAULT_APP_ID
		const appDefinition = getAppDefinition(currentApp)
		const currentProfile = config.apps?.[currentApp]
		const knownAppIds = Object.keys(KNOWN_APPS)
		const configuredAppIds = Object.keys(config.apps || {})
		const discoveredAppIds = Array.from(
			new Set([...knownAppIds, ...configuredAppIds]),
		).sort()

		return respond(
			'',
			{
				description:
					'Agent-first multi-app CLI (JSON envelopes, HATEOAS next_actions, OAuth device login)',
				current_app: currentApp,
				app: {
					id: currentApp,
					display_name: appDefinition.displayName,
					capabilities: appDefinition.capabilities,
					base_url: currentProfile?.baseUrl || appDefinition.defaultBaseUrl,
					has_stored_token: Boolean(currentProfile?.token),
				},
				config_path: getConfigPath(),
				registered_apps: knownAppIds,
				discovered_apps: discoveredAppIds,
				commands: [
					{
						name: 'app',
						description: 'Manage app profiles and active app context',
						usage: 'aihero app list',
					},
					{
						name: 'auth',
						description:
							'Headless device-flow authentication (per app profile)',
						usage: 'aihero auth login --app ai-hero',
					},
					{
						name: 'survey',
						description:
							'Survey CRUD and analytics commands (only on apps with survey API)',
						usage: 'aihero survey list --app ai-hero',
					},
				],
			},
			[
				{
					command: 'app list',
					description: 'Inspect app profiles and capabilities',
				},
				{
					command: 'auth login [--app <app-id>] [--base-url <url>]',
					description: 'Authenticate and store access token for an app profile',
					params: {
						'app-id': {
							value: currentApp,
							required: true,
						},
						url: {
							default: DEFAULT_BASE_URL,
							value: currentProfile?.baseUrl || appDefinition.defaultBaseUrl,
						},
					},
				},
				{
					command: 'survey list [--app <app-id>]',
					description: 'List surveys once authenticated',
					params: {
						'app-id': {
							value: currentApp,
							required: true,
						},
					},
				},
			],
		)
	}),
).pipe(
	Command.withSubcommands([appCommand, authCommand, surveyCommand]),
	Command.withDescription('AI Hero / app-profile CLI'),
)

const cli = Command.run(root, {
	name: CLI_NAME,
	version: CLI_VERSION,
})

const argv = process.argv.filter((arg) => arg !== '--json')

cli(argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)
