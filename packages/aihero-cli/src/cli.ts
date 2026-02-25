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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'

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

type ApiRawResponse = {
	status: number
	ok: boolean
	url: string
	headers: Record<string, string>
	body: unknown
	contentType: string | null
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
const FOCUSED_TOP_LEVEL_COMMANDS = new Set([
	'app',
	'auth',
	'creator',
	'support',
	'crud',
	'analytics',
])
const HTTP_METHODS: HttpMethod[] = [
	'GET',
	'POST',
	'PUT',
	'PATCH',
	'DELETE',
	'OPTIONS',
]
const MAX_RESPONSE_CHARS = 12_000

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

const rewriteLegacyCommandPath = (command: string) => {
	const trimmed = command.trim()
	if (!trimmed) return ''

	const [firstToken] = trimmed.split(/\s+/, 1)
	if (firstToken && FOCUSED_TOP_LEVEL_COMMANDS.has(firstToken)) return trimmed

	if (trimmed === 'survey analytics' || trimmed.startsWith('survey analytics ')) {
		return trimmed.replace(/^survey analytics\b/, 'analytics survey analytics')
	}
	if (trimmed === 'survey' || trimmed.startsWith('survey ')) {
		return trimmed.replace(/^survey\b/, 'crud survey')
	}
	if (trimmed === 'post' || trimmed.startsWith('post ')) {
		return trimmed.replace(/^post\b/, 'crud post')
	}
	if (trimmed === 'lesson' || trimmed.startsWith('lesson ')) {
		return trimmed.replace(/^lesson\b/, 'crud lesson')
	}
	if (trimmed === 'product' || trimmed.startsWith('product ')) {
		return trimmed.replace(/^product\b/, 'crud product')
	}
	if (trimmed === 'shortlink' || trimmed.startsWith('shortlink ')) {
		return trimmed.replace(/^shortlink\b/, 'crud shortlink')
	}
	if (trimmed === 'upload' || trimmed.startsWith('upload ')) {
		return trimmed.replace(/^upload\b/, 'creator upload')
	}
	if (trimmed === 'video' || trimmed.startsWith('video ')) {
		return trimmed.replace(/^video\b/, 'creator video')
	}

	return trimmed
}

const rewriteUsageInResult = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map((item) => rewriteUsageInResult(item))
	}

	if (typeof value === 'object' && value !== null) {
		const entries = Object.entries(value as Record<string, unknown>).map(
			([key, entryValue]) => {
				if (key === 'usage' && typeof entryValue === 'string') {
					const trimmed = entryValue.trim()
					if (trimmed === CLI_NAME || trimmed.startsWith(`${CLI_NAME} `)) {
						const withoutCliPrefix =
							trimmed === CLI_NAME ? '' : trimmed.slice(`${CLI_NAME} `.length)
						const rewrittenPath = rewriteLegacyCommandPath(withoutCliPrefix)
						return [key, rewrittenPath ? `${CLI_NAME} ${rewrittenPath}` : CLI_NAME]
					}
				}
				return [key, rewriteUsageInResult(entryValue)]
			},
		)
		return Object.fromEntries(entries)
	}

	return value
}

const normalizeCommand = (command: string) => {
	const trimmed = command.trim()
	if (!trimmed || trimmed === CLI_NAME) return CLI_NAME

	const withoutCliPrefix = trimmed.startsWith(`${CLI_NAME} `)
		? trimmed.slice(`${CLI_NAME} `.length)
		: trimmed
	const rewrittenPath = rewriteLegacyCommandPath(withoutCliPrefix)
	return rewrittenPath ? `${CLI_NAME} ${rewrittenPath}` : CLI_NAME
}

const respond = (command: string, result: unknown, nextActions: NextAction[]) =>
	JSON.stringify(
		{
			ok: true,
			command: normalizeCommand(command),
			result: rewriteUsageInResult(result),
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

const buildUrl = (baseUrl: string, pathname: string) => {
	const normalizedBase = baseUrl.replace(/\/+$/, '')
	const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
	return `${normalizedBase}${normalizedPath}`
}

const appendQueryParams = (
	pathname: string,
	queryParams: Record<string, string | undefined>,
) => {
	const url = new URL(pathname, 'http://localhost')
	for (const [key, value] of Object.entries(queryParams)) {
		if (value !== undefined && value !== '') {
			url.searchParams.set(key, value)
		}
	}
	return `${url.pathname}${url.search}`
}

const stringifyShort = (value: unknown, maxChars = 300) => {
	try {
		const str =
			typeof value === 'string' ? value : JSON.stringify(value, null, 2)
		if (str.length <= maxChars) return str
		return `${str.slice(0, maxChars)}…`
	} catch {
		return String(value)
	}
}

const parseJsonOption = ({
	command,
	option,
	value,
	required = false,
}: {
	command: string
	option: string
	value?: string
	required?: boolean
}): { ok: true; value: unknown } | { ok: false; payload: string } => {
	if (!value) {
		if (!required) return { ok: true, value: undefined }
		return {
			ok: false,
			payload: respondError(
				command,
				`Missing required --${option} JSON payload`,
				'MISSING_JSON_BODY',
				`Provide valid JSON in --${option}, e.g. --${option} '{"key":"value"}'.`,
				[],
			),
		}
	}

	try {
		return {
			ok: true,
			value: JSON.parse(value),
		}
	} catch (error) {
		return {
			ok: false,
			payload: respondError(
				command,
				`Invalid JSON in --${option}: ${error instanceof Error ? error.message : 'Parse error'}`,
				'INVALID_JSON_BODY',
				`Provide valid JSON in --${option}, e.g. --${option} '{"key":"value"}'.`,
				[],
			),
		}
	}
}

const compactResponseBody = async ({
	body,
	label,
}: {
	body: unknown
	label: string
}) => {
	let serialized = ''
	try {
		serialized =
			typeof body === 'string' ? body : JSON.stringify(body, null, 2) || 'null'
	} catch {
		serialized = String(body)
	}

	if (serialized.length <= MAX_RESPONSE_CHARS) {
		return {
			body,
			bodyTruncated: false,
			bodyFullOutput: null as string | null,
			bodyCharCount: serialized.length,
		}
	}

	const fullOutputPath = path.join(
		os.tmpdir(),
		`${CLI_NAME}-${label}-${Date.now()}.json`,
	)
	await fs.writeFile(fullOutputPath, serialized, 'utf8')
	return {
		body: `${serialized.slice(0, MAX_RESPONSE_CHARS)}…`,
		bodyTruncated: true,
		bodyFullOutput: fullOutputPath,
		bodyCharCount: serialized.length,
	}
}

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
	method?: HttpMethod
	token?: string
	body?: unknown
	formBody?: URLSearchParams
}): Promise<T> => {
	const url = buildUrl(baseUrl, pathname)
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

const requestApiRaw = async ({
	baseUrl,
	pathname,
	method,
	token,
	body,
	extraHeaders,
}: {
	baseUrl: string
	pathname: string
	method: HttpMethod
	token?: string
	body?: unknown
	extraHeaders?: Record<string, string>
}): Promise<ApiRawResponse> => {
	const url = buildUrl(baseUrl, pathname)
	const headers = new Headers()
	headers.set('Accept', 'application/json')
	if (token) headers.set('Authorization', `Bearer ${token}`)
	for (const [key, value] of Object.entries(extraHeaders || {})) {
		headers.set(key, value)
	}

	let payload: string | undefined
	if (body !== undefined) {
		payload = JSON.stringify(body)
		if (!headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json')
		}
	}

	const response = await fetch(url, {
		method,
		headers,
		body: payload,
	})

	const contentType = response.headers.get('content-type')
	let parsedBody: unknown

	if (contentType?.startsWith('image/')) {
		const bytes = await response.arrayBuffer()
		parsedBody = {
			type: 'binary',
			contentType,
			byteLength: bytes.byteLength,
		}
	} else {
		const rawText = await response.text()
		parsedBody = rawText
			? contentType?.includes('application/json')
				? (JSON.parse(rawText) as unknown)
				: rawText
			: null
	}

	return {
		status: response.status,
		ok: response.ok,
		url,
		contentType,
		headers: (() => {
			const headerMap: Record<string, string> = {}
			response.headers.forEach((value, key) => {
				headerMap[key] = value
			})
			return headerMap
		})(),
		body: parsedBody,
	}
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

const bodyOption = Options.text('body').pipe(
	Options.withDescription('JSON request body'),
	Options.optional,
)

const noAuthOption = Options.boolean('no-auth').pipe(
	Options.withDescription('Do not send Authorization header'),
	Options.withDefault(false),
)

const entityRequestOptions = {
	app: appOption,
	baseUrl: baseUrlOption,
	token: tokenOption,
	noAuth: noAuthOption,
}

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

const runEndpointCommand = async ({
	command,
	app,
	baseUrl,
	token,
	noAuth = false,
	method,
	pathname,
	queryParams = {},
	body,
	extraHeaders = {},
	successDescription,
	defaultNextActions,
}: {
	command: string
	app: unknown
	baseUrl: unknown
	token: unknown
	noAuth?: boolean
	method: HttpMethod
	pathname: string
	queryParams?: Record<string, string | undefined>
	body?: unknown
	extraHeaders?: Record<string, string>
	successDescription?: string
	defaultNextActions?: NextAction[]
}): Promise<string> => {
	const resolved = await withContext({
		app,
		baseUrl,
		token,
		command,
		requireToken: false,
	})
	if (!resolved.ok) return resolved.payload

	const finalPath = appendQueryParams(pathname, queryParams)
	const response = await requestApiRaw({
		baseUrl: resolved.context.baseUrl,
		pathname: finalPath,
		method,
		token: noAuth ? undefined : resolved.context.token,
		body,
		extraHeaders,
	})

	const compactBody = await compactResponseBody({
		body: response.body,
		label: `${resolved.context.appId}-${method.toLowerCase()}-${finalPath.replace(/[^a-z0-9]+/gi, '-')}`,
	})

	const authNextActions: NextAction[] =
		response.status === 401 || response.status === 403
			? [
					{
						command: 'auth login [--app <app-id>] [--base-url <url>]',
						description: 'Authenticate and retry',
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
					{
						command:
							'auth whoami [--app <app-id>] [--base-url <url>] [--token <token>]',
						description: 'Verify active identity and token',
						params: {
							'app-id': {
								value: resolved.context.appId,
								required: true,
							},
						},
					},
				]
			: []

	const nextActions = [
		...(defaultNextActions || []),
		...authNextActions,
	].filter(
		(action, index, all) =>
			all.findIndex((candidate) => candidate.command === action.command) ===
			index,
	)

	if (nextActions.length === 0) {
		nextActions.push({
			command: 'app current',
			description: 'Show current app profile context',
		})
	}

	if (!response.ok) {
		return respondError(
			command,
			`HTTP ${response.status} from ${method} ${finalPath}: ${stringifyShort(response.body)}`,
			`HTTP_${response.status}`,
			'Check request parameters/body and permissions, then retry.',
			nextActions,
		)
	}

	return respond(
		command,
		{
			app: resolved.context.appId,
			...(successDescription && { description: successDescription }),
			method,
			path: finalPath,
			url: response.url,
			status: response.status,
			content_type: response.contentType,
			body: compactBody.body,
			body_truncated: compactBody.bodyTruncated,
			body_char_count: compactBody.bodyCharCount,
			...(compactBody.bodyFullOutput && {
				body_full_output: compactBody.bodyFullOutput,
			}),
		},
		nextActions,
	)
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

const authRouteCommand = Command.make(
	'route',
	{
		app: appOption,
		baseUrl: baseUrlOption,
		token: tokenOption,
		noAuth: noAuthOption,
		action: Args.text({ name: 'action' }).pipe(
			Args.withDescription(
				'NextAuth catchall path (for example: session, csrf, providers, callback/github)',
			),
		),
		method: Options.text('method').pipe(
			Options.withDescription(`HTTP method (${HTTP_METHODS.join('|')})`),
			Options.optional,
		),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, action, method, body }) =>
		runAndPrint(async () => {
			const normalizedAction = action.replace(/^\/+/, '')
			const resolvedMethod = (unwrapOption<string>(method) || 'GET').toUpperCase()
			if (!HTTP_METHODS.includes(resolvedMethod as HttpMethod)) {
				return respondError(
					`auth route ${normalizedAction}`,
					`Unsupported --method '${resolvedMethod}'`,
					'INVALID_HTTP_METHOD',
					`Use one of: ${HTTP_METHODS.join(', ')}.`,
					[],
				)
			}

			const parsedBody = parseJsonOption({
				command: `auth route ${normalizedAction}`,
				option: 'body',
				value: unwrapOption<string>(body),
				required: false,
			})
			if (!parsedBody.ok) return parsedBody.payload

			return runEndpointCommand({
				command: `auth route ${normalizedAction}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: resolvedMethod as HttpMethod,
				pathname: `/api/auth/${normalizedAction}`,
				body: parsedBody.value,
				defaultNextActions: [
					{
						command: 'auth route session [--app <app-id>] [--method <method>]',
						description: 'Inspect current auth session',
						params: {
							'app-id': {
								value: DEFAULT_APP_ID,
								required: true,
							},
							method: {
								default: 'GET',
								enum: ['GET', 'POST'],
							},
						},
					},
					{
						command: 'auth route providers [--app <app-id>] [--method <method>]',
						description: 'List configured auth providers',
						params: {
							'app-id': {
								value: DEFAULT_APP_ID,
								required: true,
							},
							method: {
								default: 'GET',
								enum: ['GET'],
							},
						},
					},
				],
			})
		}),
).pipe(Command.withDescription('Call /api/auth/[...nextauth] catchall endpoints'))

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

const postListCommand = Command.make(
	'list',
	{
		...entityRequestOptions,
		slugOrId: Options.text('slug-or-id').pipe(Options.optional),
	},
	({ app, baseUrl, token, noAuth, slugOrId }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'post list',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/posts',
				queryParams: {
					slugOrId: unwrapOption<string>(slugOrId),
				},
				defaultNextActions: [
					{
						command: 'post create --body <json> [--app <app-id>]',
						description: 'Create a post',
						params: {
							json: {
								description: 'Post JSON payload',
								required: true,
							},
							'app-id': {
								value: DEFAULT_APP_ID,
								required: true,
							},
						},
					},
				],
			}),
		),
).pipe(Command.withDescription('List posts or get a post by slug/id'))

const postGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
		slugOrId: Args.text({ name: 'slug-or-id' }).pipe(
			Args.withDescription('Post slug or ID'),
		),
	},
	({ app, baseUrl, token, noAuth, slugOrId }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `post get ${slugOrId}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/posts',
				queryParams: { slugOrId },
				defaultNextActions: [
					{
						command:
							'post update <id> --body <json> [--action <action>] [--app <app-id>]',
						description: 'Update a post',
						params: {
							id: {
								description: 'Post ID',
								required: true,
							},
							json: {
								description: 'JSON patch payload',
								required: true,
							},
						},
					},
				],
			}),
		),
).pipe(Command.withDescription('Get a post by slug or ID'))

const postCreateCommand = Command.make(
	'create',
	{
		...entityRequestOptions,
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: 'post create',
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload

			return runEndpointCommand({
				command: 'post create',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/posts',
				body: parsedBody.value,
				defaultNextActions: [
					{
						command: 'post list [--app <app-id>]',
						description: 'List posts',
						params: {
							'app-id': {
								value: DEFAULT_APP_ID,
								required: true,
							},
						},
					},
				],
			})
		}),
).pipe(Command.withDescription('Create a post from JSON payload'))

const postUpdateCommand = Command.make(
	'update',
	{
		...entityRequestOptions,
		id: Args.text({ name: 'id' }).pipe(Args.withDescription('Post ID')),
		action: Options.text('action').pipe(Options.optional),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, id, action, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: `post update ${id}`,
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload

			return runEndpointCommand({
				command: `post update ${id}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'PUT',
				pathname: '/api/posts',
				queryParams: {
					id,
					action: unwrapOption<string>(action),
				},
				body: parsedBody.value,
				defaultNextActions: [
					{
						command: 'post get <slug-or-id> [--app <app-id>]',
						description: 'Fetch a post',
						params: {
							'slug-or-id': {
								value: id,
								required: true,
							},
						},
					},
				],
			})
		}),
).pipe(Command.withDescription('Update a post by ID'))

const postDeleteCommand = Command.make(
	'delete',
	{
		...entityRequestOptions,
		id: Args.text({ name: 'id' }).pipe(Args.withDescription('Post ID')),
	},
	({ app, baseUrl, token, noAuth, id }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `post delete ${id}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'DELETE',
				pathname: '/api/posts',
				queryParams: { id },
				defaultNextActions: [
					{
						command: 'post list [--app <app-id>]',
						description: 'List remaining posts',
					},
				],
			}),
		),
).pipe(Command.withDescription('Delete a post by ID'))

const postCommand = Command.make('post', {}, () =>
	runAndPrint(async () =>
		respond(
			'post',
			{
				description: 'Post operations',
				commands: [
					{
						name: 'list',
						description: 'List posts',
						usage: 'aihero post list [--slug-or-id <slug-or-id>]',
					},
					{
						name: 'get',
						description: 'Get a post by slug or ID',
						usage: 'aihero post get <slug-or-id>',
					},
					{
						name: 'create',
						description: 'Create a post from JSON',
						usage: "aihero post create --body '<json>'",
					},
					{
						name: 'update',
						description: 'Update a post by ID',
						usage: "aihero post update <id> --body '<json>' [--action <action>]",
					},
					{
						name: 'delete',
						description: 'Delete a post by ID',
						usage: 'aihero post delete <id>',
					},
				],
			},
			[
				{
					command: 'post list [--app <app-id>]',
					description: 'List posts',
				},
				{
					command: "post create --body '<json>' [--app <app-id>]",
					description: 'Create a post',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([
		postListCommand,
		postGetCommand,
		postCreateCommand,
		postUpdateCommand,
		postDeleteCommand,
	]),
	Command.withDescription('Post CRUD operations'),
)

const lessonListCommand = Command.make(
	'list',
	{
		...entityRequestOptions,
		slugOrId: Options.text('slug-or-id').pipe(Options.optional),
	},
	({ app, baseUrl, token, noAuth, slugOrId }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'lesson list',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/lessons',
				queryParams: {
					slugOrId: unwrapOption<string>(slugOrId),
				},
			}),
		),
).pipe(Command.withDescription('List lessons or get lesson by slug/id'))

const lessonUpdateCommand = Command.make(
	'update',
	{
		...entityRequestOptions,
		id: Args.text({ name: 'id' }).pipe(Args.withDescription('Lesson ID')),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, id, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: `lesson update ${id}`,
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload

			return runEndpointCommand({
				command: `lesson update ${id}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'PUT',
				pathname: '/api/lessons',
				queryParams: { id },
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('Update a lesson by ID'))

const lessonSolutionGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
		lessonId: Args.text({ name: 'lesson-id' }).pipe(
			Args.withDescription('Lesson ID'),
		),
	},
	({ app, baseUrl, token, noAuth, lessonId }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `lesson solution get ${lessonId}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: `/api/lessons/${lessonId}/solution`,
			}),
		),
).pipe(Command.withDescription('Get lesson solution'))

const lessonSolutionCreateCommand = Command.make(
	'create',
	{
		...entityRequestOptions,
		lessonId: Args.text({ name: 'lesson-id' }).pipe(
			Args.withDescription('Lesson ID'),
		),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, lessonId, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: `lesson solution create ${lessonId}`,
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload

			return runEndpointCommand({
				command: `lesson solution create ${lessonId}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: `/api/lessons/${lessonId}/solution`,
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('Create lesson solution'))

const lessonSolutionUpdateCommand = Command.make(
	'update',
	{
		...entityRequestOptions,
		lessonId: Args.text({ name: 'lesson-id' }).pipe(
			Args.withDescription('Lesson ID'),
		),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, lessonId, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: `lesson solution update ${lessonId}`,
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload

			return runEndpointCommand({
				command: `lesson solution update ${lessonId}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'PUT',
				pathname: `/api/lessons/${lessonId}/solution`,
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('Update lesson solution'))

const lessonSolutionDeleteCommand = Command.make(
	'delete',
	{
		...entityRequestOptions,
		lessonId: Args.text({ name: 'lesson-id' }).pipe(
			Args.withDescription('Lesson ID'),
		),
	},
	({ app, baseUrl, token, noAuth, lessonId }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `lesson solution delete ${lessonId}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'DELETE',
				pathname: `/api/lessons/${lessonId}/solution`,
			}),
		),
).pipe(Command.withDescription('Delete lesson solution'))

const lessonSolutionCommand = Command.make('solution', {}, () =>
	runAndPrint(async () =>
		respond(
			'lesson solution',
			{
				description: 'Lesson solution operations',
				commands: [
					{
						name: 'get',
						description: 'Get lesson solution',
						usage: 'aihero lesson solution get <lesson-id>',
					},
					{
						name: 'create',
						description: 'Create lesson solution from JSON',
						usage: "aihero lesson solution create <lesson-id> --body '<json>'",
					},
					{
						name: 'update',
						description: 'Update lesson solution with JSON',
						usage: "aihero lesson solution update <lesson-id> --body '<json>'",
					},
					{
						name: 'delete',
						description: 'Delete lesson solution',
						usage: 'aihero lesson solution delete <lesson-id>',
					},
				],
			},
			[
				{
					command: 'lesson solution get <lesson-id> [--app <app-id>]',
					description: 'Fetch lesson solution',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([
		lessonSolutionGetCommand,
		lessonSolutionCreateCommand,
		lessonSolutionUpdateCommand,
		lessonSolutionDeleteCommand,
	]),
	Command.withDescription('Lesson solution CRUD'),
)

const lessonCommand = Command.make('lesson', {}, () =>
	runAndPrint(async () =>
		respond(
			'lesson',
			{
				description: 'Lesson operations',
				commands: [
					{
						name: 'list',
						description: 'List lessons',
						usage: 'aihero lesson list [--slug-or-id <slug-or-id>]',
					},
					{
						name: 'update',
						description: 'Update lesson',
						usage: "aihero lesson update <id> --body '<json>'",
					},
					{
						name: 'solution',
						description: 'Manage lesson solutions',
						usage: 'aihero lesson solution get <lesson-id>',
					},
				],
			},
			[
				{
					command: 'lesson list [--app <app-id>]',
					description: 'List lessons',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([
		lessonListCommand,
		lessonUpdateCommand,
		lessonSolutionCommand,
	]),
	Command.withDescription('Lesson and solution operations'),
)

const productListCommand = Command.make(
	'list',
	{
		...entityRequestOptions,
		slugOrId: Options.text('slug-or-id').pipe(Options.optional),
	},
	({ app, baseUrl, token, noAuth, slugOrId }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'product list',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/products',
				queryParams: {
					slugOrId: unwrapOption<string>(slugOrId),
				},
			}),
		),
).pipe(Command.withDescription('List products or get product by slug/id'))

const productAvailabilityCommand = Command.make(
	'availability',
	{
		...entityRequestOptions,
		productId: Args.text({ name: 'product-id' }).pipe(
			Args.withDescription('Product ID'),
		),
	},
	({ app, baseUrl, token, noAuth, productId }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `product availability ${productId}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: `/api/products/${productId}/availability`,
			}),
		),
).pipe(Command.withDescription('Get seat availability for product'))

const productCommand = Command.make('product', {}, () =>
	runAndPrint(async () =>
		respond(
			'product',
			{
				description: 'Product operations',
				commands: [
					{
						name: 'list',
						description: 'List products',
						usage: 'aihero product list [--slug-or-id <slug-or-id>]',
					},
					{
						name: 'availability',
						description: 'Check product seat availability',
						usage: 'aihero product availability <product-id>',
					},
				],
			},
			[
				{
					command: 'product list [--app <app-id>]',
					description: 'List products',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([productListCommand, productAvailabilityCommand]),
	Command.withDescription('Product operations'),
)

const shortlinkListCommand = Command.make(
	'list',
	{
		...entityRequestOptions,
		search: Options.text('search').pipe(Options.optional),
	},
	({ app, baseUrl, token, noAuth, search }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'shortlink list',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/shortlinks',
				queryParams: {
					search: unwrapOption<string>(search),
				},
			}),
		),
).pipe(Command.withDescription('List shortlinks'))

const shortlinkGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
		id: Args.text({ name: 'id' }).pipe(Args.withDescription('Shortlink ID')),
	},
	({ app, baseUrl, token, noAuth, id }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `shortlink get ${id}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/shortlinks',
				queryParams: { id },
			}),
		),
).pipe(Command.withDescription('Get shortlink by ID'))

const shortlinkCreateCommand = Command.make(
	'create',
	{
		...entityRequestOptions,
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: 'shortlink create',
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload

			return runEndpointCommand({
				command: 'shortlink create',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/shortlinks',
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('Create shortlink from JSON payload'))

const shortlinkUpdateCommand = Command.make(
	'update',
	{
		...entityRequestOptions,
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: 'shortlink update',
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload

			return runEndpointCommand({
				command: 'shortlink update',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'PATCH',
				pathname: '/api/shortlinks',
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('Update shortlink with JSON payload'))

const shortlinkDeleteCommand = Command.make(
	'delete',
	{
		...entityRequestOptions,
		id: Args.text({ name: 'id' }).pipe(Args.withDescription('Shortlink ID')),
	},
	({ app, baseUrl, token, noAuth, id }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `shortlink delete ${id}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'DELETE',
				pathname: '/api/shortlinks',
				queryParams: { id },
			}),
		),
).pipe(Command.withDescription('Delete shortlink by ID'))

const shortlinkCommand = Command.make('shortlink', {}, () =>
	runAndPrint(async () =>
		respond(
			'shortlink',
			{
				description: 'Shortlink operations',
				commands: [
					{
						name: 'list',
						description: 'List shortlinks',
						usage: 'aihero shortlink list [--search <text>]',
					},
					{
						name: 'get',
						description: 'Get shortlink by ID',
						usage: 'aihero shortlink get <id>',
					},
					{
						name: 'create',
						description: 'Create shortlink from JSON',
						usage: "aihero shortlink create --body '<json>'",
					},
					{
						name: 'update',
						description: 'Update shortlink from JSON',
						usage: "aihero shortlink update --body '<json>'",
					},
					{
						name: 'delete',
						description: 'Delete shortlink',
						usage: 'aihero shortlink delete <id>',
					},
				],
			},
			[
				{
					command: 'shortlink list [--app <app-id>]',
					description: 'List shortlinks',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([
		shortlinkListCommand,
		shortlinkGetCommand,
		shortlinkCreateCommand,
		shortlinkUpdateCommand,
		shortlinkDeleteCommand,
	]),
	Command.withDescription('Shortlink CRUD operations'),
)

const uploadNewCommand = Command.make(
	'new',
	{
		...entityRequestOptions,
		fileUrl: Options.text('file-url').pipe(
			Options.withDescription('Uploaded file URL'),
			Options.optional,
		),
		fileName: Options.text('file-name').pipe(
			Options.withDescription('Optional file name'),
			Options.optional,
		),
		parentResourceId: Options.text('parent-resource-id').pipe(
			Options.withDescription('Parent resource ID'),
			Options.optional,
		),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, fileUrl, fileName, parentResourceId, body }) =>
		runAndPrint(async () => {
			let payload: unknown
			const rawBody = unwrapOption<string>(body)
			if (rawBody) {
				const parsedBody = parseJsonOption({
					command: 'upload new',
					option: 'body',
					value: rawBody,
					required: true,
				})
				if (!parsedBody.ok) return parsedBody.payload
				payload = parsedBody.value
			} else {
				const urlValue = unwrapOption<string>(fileUrl)
				const parentIdValue = unwrapOption<string>(parentResourceId)
				if (!urlValue || !parentIdValue) {
					return respondError(
						'upload new',
						'Missing upload payload',
						'MISSING_UPLOAD_PAYLOAD',
						"Provide --body JSON or both --file-url and --parent-resource-id.",
						[],
					)
				}
				payload = {
					file: {
						url: urlValue,
						...(unwrapOption<string>(fileName) && {
							name: unwrapOption<string>(fileName),
						}),
					},
					metadata: {
						parentResourceId: parentIdValue,
					},
				}
			}

			return runEndpointCommand({
				command: 'upload new',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/uploads/new',
				body: payload,
			})
		}),
).pipe(Command.withDescription('Create new uploaded video event'))

const uploadSignedUrlCommand = Command.make(
	'signed-url',
	{
		...entityRequestOptions,
		objectName: Options.text('object-name').pipe(
			Options.withDescription('Object filename/key'),
			Options.optional,
		),
	},
	({ app, baseUrl, token, noAuth, objectName }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'upload signed-url',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/uploads/signed-url',
				queryParams: {
					objectName: unwrapOption<string>(objectName),
				},
			}),
		),
).pipe(Command.withDescription('Get signed upload URL'))

const uploadCommand = Command.make('upload', {}, () =>
	runAndPrint(async () =>
		respond(
			'upload',
			{
				description: 'Upload-related operations',
				commands: [
					{
						name: 'new',
						description: 'Submit uploaded file event',
						usage:
							'aihero upload new --file-url <url> --parent-resource-id <id>',
					},
					{
						name: 'signed-url',
						description: 'Get signed S3 upload URL',
						usage: 'aihero upload signed-url --object-name <filename>',
					},
				],
			},
			[
				{
					command: 'upload signed-url --object-name <filename>',
					description: 'Request a signed upload URL',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([uploadNewCommand, uploadSignedUrlCommand]),
	Command.withDescription('Upload endpoints'),
)

const videoGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
		videoResourceId: Args.text({ name: 'video-resource-id' }).pipe(
			Args.withDescription('Video resource ID'),
		),
	},
	({ app, baseUrl, token, noAuth, videoResourceId }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `video get ${videoResourceId}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: `/api/${videoResourceId}`,
			}),
		),
).pipe(Command.withDescription('Get video resource by ID'))

const videoThumbnailCommand = Command.make(
	'thumbnail',
	{
		...entityRequestOptions,
		videoResourceId: Args.text({ name: 'video-resource-id' }).pipe(
			Args.withDescription('Video resource ID'),
		),
		time: Options.text('time').pipe(
			Options.withDescription('Thumbnail time in seconds'),
			Options.optional,
		),
	},
	({ app, baseUrl, token, noAuth, videoResourceId, time }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `video thumbnail ${videoResourceId}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/thumbnails',
				queryParams: {
					videoResourceId,
					time: unwrapOption<string>(time),
				},
			}),
		),
).pipe(Command.withDescription('Get video thumbnail image metadata'))

const videoCommand = Command.make('video', {}, () =>
	runAndPrint(async () =>
		respond(
			'video',
			{
				description: 'Video resource operations',
				commands: [
					{
						name: 'get',
						description: 'Get video resource',
						usage: 'aihero video get <video-resource-id>',
					},
					{
						name: 'thumbnail',
						description: 'Get thumbnail for video resource',
						usage: 'aihero video thumbnail <video-resource-id> [--time <seconds>]',
					},
				],
			},
			[
				{
					command: 'video get <video-resource-id> [--app <app-id>]',
					description: 'Fetch video resource',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([videoGetCommand, videoThumbnailCommand]),
	Command.withDescription('Video and thumbnail endpoints'),
)

const certificateGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
		resource: Options.text('resource').pipe(
			Options.withDescription('Resource slug or ID'),
			Options.optional,
		),
		user: Options.text('user').pipe(
			Options.withDescription('User ID or email'),
			Options.optional,
		),
	},
	({ app, baseUrl, token, noAuth, resource, user }) =>
		runAndPrint(async () => {
			const resourceValue = unwrapOption<string>(resource)
			const userValue = unwrapOption<string>(user)
			if (!resourceValue || !userValue) {
				return respondError(
					'certificate get',
					'Missing --resource or --user',
					'MISSING_CERTIFICATE_QUERY',
					'Provide both --resource and --user.',
					[],
				)
			}

			return runEndpointCommand({
				command: 'certificate get',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/certificates',
				queryParams: {
					resource: resourceValue,
					user: userValue,
				},
			})
		}),
).pipe(Command.withDescription('Generate certificate image/response'))

const certificateCommand = Command.make('certificate', {}, () =>
	runAndPrint(async () =>
		respond(
			'certificate',
			{
				description: 'Certificate generation endpoint',
				commands: [
					{
						name: 'get',
						description: 'Generate certificate',
						usage: 'aihero certificate get --resource <slug-or-id> --user <id>',
					},
				],
			},
			[
				{
					command:
						'certificate get --resource <slug-or-id> --user <id> [--app <app-id>]',
					description: 'Generate certificate',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([certificateGetCommand]),
	Command.withDescription('Certificate endpoint'),
)

const ogGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
		resource: Options.text('resource').pipe(Options.optional),
		title: Options.text('title').pipe(Options.optional),
		image: Options.text('image').pipe(Options.optional),
	},
	({ app, baseUrl, token, noAuth, resource, title, image }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'og get',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/og',
				queryParams: {
					resource: unwrapOption<string>(resource),
					title: unwrapOption<string>(title),
					image: unwrapOption<string>(image),
				},
			}),
		),
).pipe(Command.withDescription('Generate OG image'))

const ogDefaultCommand = Command.make(
	'default',
	{
		...entityRequestOptions,
		title: Options.text('title').pipe(Options.optional),
	},
	({ app, baseUrl, token, noAuth, title }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'og default',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/og/default',
				queryParams: {
					title: unwrapOption<string>(title),
				},
			}),
		),
).pipe(Command.withDescription('Generate default OG image'))

const ogCommand = Command.make('og', {}, () =>
	runAndPrint(async () =>
		respond(
			'og',
			{
				description: 'Open Graph image endpoints',
				commands: [
					{
						name: 'get',
						description: 'Generate OG image',
						usage:
							'aihero og get [--resource <slug-or-id>] [--title <title>] [--image <url>]',
					},
					{
						name: 'default',
						description: 'Generate default OG image',
						usage: 'aihero og default [--title <title>]',
					},
				],
			},
			[
				{
					command: 'og get [--resource <slug-or-id>] [--app <app-id>]',
					description: 'Generate OG image',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([ogGetCommand, ogDefaultCommand]),
	Command.withDescription('OG image endpoints'),
)

const chatSendCommand = Command.make(
	'send',
	{
		...entityRequestOptions,
		messages: Options.text('messages').pipe(
			Options.withDescription('JSON array of chat messages'),
			Options.optional,
		),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, messages, body }) =>
		runAndPrint(async () => {
			const messagesRaw = unwrapOption<string>(messages)
			const bodyRaw = unwrapOption<string>(body)
			const parsed = parseJsonOption({
				command: 'chat send',
				option: messagesRaw ? 'messages' : 'body',
				value: messagesRaw || bodyRaw,
				required: true,
			})
			if (!parsed.ok) return parsed.payload

			const payload =
				messagesRaw || !bodyRaw
					? { messages: parsed.value }
					: (parsed.value as unknown)

			return runEndpointCommand({
				command: 'chat send',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/chat',
				body: payload,
			})
		}),
).pipe(Command.withDescription('Send chat messages to /api/chat'))

const chatCommand = Command.make('chat', {}, () =>
	runAndPrint(async () =>
		respond(
			'chat',
			{
				description: 'Chat endpoint',
				commands: [
					{
						name: 'send',
						description: 'Send messages to chat endpoint',
						usage: "aihero chat send --messages '<json-array>'",
					},
				],
			},
			[
				{
					command: "chat send --messages '<json-array>' [--app <app-id>]",
					description: 'Send chat messages',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([chatSendCommand]),
	Command.withDescription('Chat endpoint'),
)

const coursebuilderGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
		path: Args.text({ name: 'path' }).pipe(
			Args.withDescription('Coursebuilder catchall path'),
		),
	},
	({ app, baseUrl, token, noAuth, path }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `coursebuilder get ${path}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: `/api/coursebuilder/${path.replace(/^\/+/, '')}`,
			}),
		),
).pipe(Command.withDescription('GET /api/coursebuilder/[...path]'))

const coursebuilderPostCommand = Command.make(
	'post',
	{
		...entityRequestOptions,
		path: Args.text({ name: 'path' }).pipe(
			Args.withDescription('Coursebuilder catchall path'),
		),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, path, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: `coursebuilder post ${path}`,
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload
			return runEndpointCommand({
				command: `coursebuilder post ${path}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: `/api/coursebuilder/${path.replace(/^\/+/, '')}`,
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('POST /api/coursebuilder/[...path]'))

const coursebuilderSubscribeCommand = Command.make(
	'subscribe',
	{
		...entityRequestOptions,
		email: Options.text('email').pipe(
			Options.withDescription('Email address'),
			Options.optional,
		),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, email, body }) =>
		runAndPrint(async () => {
			const bodyRaw = unwrapOption<string>(body)
			let payload: unknown
			if (bodyRaw) {
				const parsedBody = parseJsonOption({
					command: 'coursebuilder subscribe',
					option: 'body',
					value: bodyRaw,
					required: true,
				})
				if (!parsedBody.ok) return parsedBody.payload
				payload = parsedBody.value
			} else {
				const emailValue = unwrapOption<string>(email)
				if (!emailValue) {
					return respondError(
						'coursebuilder subscribe',
						'Missing --email or --body',
						'MISSING_SUBSCRIBE_PAYLOAD',
						'Provide --email or full --body JSON payload.',
						[],
					)
				}
				payload = { email: emailValue }
			}
			return runEndpointCommand({
				command: 'coursebuilder subscribe',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/coursebuilder/subscribe-to-list/convertkit',
				body: payload,
			})
		}),
).pipe(Command.withDescription('Subscribe email via convertkit endpoint'))

const coursebuilderCommand = Command.make('coursebuilder', {}, () =>
	runAndPrint(async () =>
		respond(
			'coursebuilder',
			{
				description: 'Coursebuilder integration endpoints',
				commands: [
					{
						name: 'get',
						description: 'GET catchall path',
						usage: 'aihero coursebuilder get <path>',
					},
					{
						name: 'post',
						description: 'POST catchall path',
						usage: "aihero coursebuilder post <path> --body '<json>'",
					},
					{
						name: 'subscribe',
						description: 'Subscribe to list',
						usage: 'aihero coursebuilder subscribe --email <email>',
					},
				],
			},
			[
				{
					command: 'coursebuilder subscribe --email <email> [--app <app-id>]',
					description: 'Subscribe to list',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([
		coursebuilderGetCommand,
		coursebuilderPostCommand,
		coursebuilderSubscribeCommand,
	]),
	Command.withDescription('Coursebuilder endpoints'),
)

const inngestGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
	},
	({ app, baseUrl, token, noAuth }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'inngest get',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/inngest',
			}),
		),
).pipe(Command.withDescription('GET /api/inngest'))

const inngestPostCommand = Command.make(
	'post',
	{
		...entityRequestOptions,
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: 'inngest post',
				option: 'body',
				value: unwrapOption<string>(body),
				required: false,
			})
			if (!parsedBody.ok) return parsedBody.payload
			return runEndpointCommand({
				command: 'inngest post',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/inngest',
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('POST /api/inngest'))

const inngestPutCommand = Command.make(
	'put',
	{
		...entityRequestOptions,
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: 'inngest put',
				option: 'body',
				value: unwrapOption<string>(body),
				required: false,
			})
			if (!parsedBody.ok) return parsedBody.payload
			return runEndpointCommand({
				command: 'inngest put',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'PUT',
				pathname: '/api/inngest',
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('PUT /api/inngest (refresh/sync)'))

const inngestCommand = Command.make('inngest', {}, () =>
	runAndPrint(async () =>
		respond(
			'inngest',
			{
				description: 'Inngest route handlers',
				commands: [
					{
						name: 'get',
						description: 'GET /api/inngest',
						usage: 'aihero inngest get',
					},
					{
						name: 'post',
						description: 'POST /api/inngest',
						usage: "aihero inngest post [--body '<json>']",
					},
					{
						name: 'put',
						description: 'PUT /api/inngest',
						usage: "aihero inngest put [--body '<json>']",
					},
				],
			},
			[
				{
					command: 'inngest get [--app <app-id>]',
					description: 'Inspect inngest route',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([
		inngestGetCommand,
		inngestPostCommand,
		inngestPutCommand,
	]),
	Command.withDescription('Inngest endpoints'),
)

const cronRunCommand = Command.make(
	'run',
	{
		...entityRequestOptions,
	},
	({ app, baseUrl, token, noAuth }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'cron run',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: '/api/cron',
			}),
		),
).pipe(Command.withDescription('Run cron refresh endpoint'))

const cronCommand = Command.make('cron', {}, () =>
	runAndPrint(async () =>
		respond(
			'cron',
			{
				description: 'Cron endpoint',
				commands: [
					{
						name: 'run',
						description: 'Trigger /api/cron',
						usage: 'aihero cron run',
					},
				],
			},
			[
				{
					command: 'cron run [--app <app-id>]',
					description: 'Trigger cron refresh',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([cronRunCommand]),
	Command.withDescription('Cron endpoint'),
)

const muxUploadUrlCommand = Command.make(
	'upload-url',
	{
		...entityRequestOptions,
	},
	({ app, baseUrl, token, noAuth }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'mux upload-url',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/mux',
			}),
		),
).pipe(Command.withDescription('Create Mux direct upload URL'))

const muxWebhookCommand = Command.make(
	'webhook',
	{
		...entityRequestOptions,
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: 'mux webhook',
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload
			return runEndpointCommand({
				command: 'mux webhook',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/mux/webhook',
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('Send payload to mux webhook endpoint'))

const muxCommand = Command.make('mux', {}, () =>
	runAndPrint(async () =>
		respond(
			'mux',
			{
				description: 'Mux endpoints',
				commands: [
					{
						name: 'upload-url',
						description: 'Create direct upload URL',
						usage: 'aihero mux upload-url',
					},
					{
						name: 'webhook',
						description: 'Send mux webhook payload',
						usage: "aihero mux webhook --body '<json>'",
					},
				],
			},
			[
				{
					command: 'mux upload-url [--app <app-id>]',
					description: 'Request Mux upload URL',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([muxUploadUrlCommand, muxWebhookCommand]),
	Command.withDescription('Mux endpoints'),
)

const ocrWebhookCommand = Command.make(
	'ocr',
	{
		...entityRequestOptions,
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: 'webhook ocr',
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload
			return runEndpointCommand({
				command: 'webhook ocr',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/ocr/webhook',
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('Send payload to OCR webhook endpoint'))

const postmarkWebhookCommand = Command.make(
	'postmark',
	{
		...entityRequestOptions,
		body: bodyOption,
		secret: Options.text('secret').pipe(
			Options.withDescription('POSTMARK_WEBHOOK_SECRET (header override)'),
			Options.optional,
		),
	},
	({ app, baseUrl, token, noAuth, body, secret }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: 'webhook postmark',
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload
			return runEndpointCommand({
				command: 'webhook postmark',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/postmark/webhook',
				body: parsedBody.value,
				extraHeaders: unwrapOption<string>(secret)
					? {
							'course-builder': unwrapOption<string>(secret) as string,
						}
					: {},
			})
		}),
).pipe(Command.withDescription('Send payload to postmark webhook endpoint'))

const webhookCommand = Command.make('webhook', {}, () =>
	runAndPrint(async () =>
		respond(
			'webhook',
			{
				description: 'Webhook endpoints',
				commands: [
					{
						name: 'ocr',
						description: 'Send OCR webhook payload',
						usage: "aihero webhook ocr --body '<json>'",
					},
					{
						name: 'postmark',
						description: 'Send Postmark webhook payload',
						usage: "aihero webhook postmark --body '<json>' [--secret <secret>]",
					},
				],
			},
			[
				{
					command: "webhook ocr --body '<json>' [--app <app-id>]",
					description: 'Send OCR webhook payload',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([ocrWebhookCommand, postmarkWebhookCommand]),
	Command.withDescription('Webhook helpers'),
)

const supportActionCommand = Command.make(
	'action',
	{
		...entityRequestOptions,
		action: Args.text({ name: 'action' }).pipe(
			Args.withDescription('Support action path segment'),
		),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, action, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: `support action ${action}`,
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload
			return runEndpointCommand({
				command: `support action ${action}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: `/api/support/${action.replace(/^\/+/, '')}`,
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('Invoke support action endpoint'))

const supportCommand = Command.make('support', {}, () =>
	runAndPrint(async () =>
		respond(
			'support',
			{
				description: 'Support integration endpoint',
				commands: [
					{
						name: 'action',
						description: 'Invoke support action',
						usage: "aihero support action <action> --body '<json>'",
					},
				],
			},
			[
				{
					command: "support action <action> --body '<json>' [--app <app-id>]",
					description: 'Invoke support action',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([supportActionCommand]),
	Command.withDescription('Support endpoint'),
)

const creatorCommand = Command.make('creator', {}, () =>
	runAndPrint(async () =>
		respond(
			'creator',
			{
				description:
					'Creator workflow surface area (upload + video operations, post publishing via CRUD)',
				commands: [
					{
						name: 'upload',
						description: 'Get signed URLs and register uploaded videos',
						usage:
							'aihero creator upload signed-url --object-name <filename>',
					},
					{
						name: 'video',
						description: 'Inspect video resources and thumbnails',
						usage: 'aihero creator video get <video-resource-id>',
					},
					{
						name: 'post',
						description: 'Create and manage posts via CRUD surface',
						usage: 'aihero crud post create --body <json>',
					},
				],
			},
			[
				{
					command:
						'creator upload signed-url --object-name <filename> [--app <app-id>]',
					description: 'Get signed S3 URL for creator upload flow',
					params: {
						filename: {
							description: 'Original file name',
							required: true,
						},
						'app-id': {
							value: DEFAULT_APP_ID,
							required: true,
						},
					},
				},
				{
					command: 'creator video get <video-resource-id> [--app <app-id>]',
					description: 'Fetch video resource status',
					params: {
						'video-resource-id': {
							description: 'Video resource ID',
							required: true,
						},
						'app-id': {
							value: DEFAULT_APP_ID,
							required: true,
						},
					},
				},
				{
					command: "crud post create --body '<json>' [--app <app-id>]",
					description: 'Create a post',
					params: {
						json: {
							description: 'Post JSON payload',
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
	Command.withSubcommands([uploadCommand, videoCommand]),
	Command.withDescription('Creator-oriented workflows'),
)

const crudCommand = Command.make('crud', {}, () =>
	runAndPrint(async () =>
		respond(
			'crud',
			{
				description: 'CRUD surfaces for content and links',
				commands: [
					{
						name: 'survey',
						description: 'Survey CRUD operations',
						usage: 'aihero crud survey list [--app <app-id>]',
					},
					{
						name: 'post',
						description: 'Post CRUD operations',
						usage: 'aihero crud post list [--app <app-id>]',
					},
					{
						name: 'lesson',
						description: 'Lesson and solution operations',
						usage: 'aihero crud lesson list [--app <app-id>]',
					},
					{
						name: 'product',
						description: 'Product lookup and availability operations',
						usage: 'aihero crud product list [--app <app-id>]',
					},
					{
						name: 'shortlink',
						description: 'Shortlink CRUD operations',
						usage: 'aihero crud shortlink list [--app <app-id>]',
					},
				],
			},
			[
				{
					command: 'crud survey list [--app <app-id>]',
					description: 'List surveys',
					params: {
						'app-id': {
							value: DEFAULT_APP_ID,
							required: true,
						},
					},
				},
				{
					command: 'crud post list [--app <app-id>]',
					description: 'List posts',
					params: {
						'app-id': {
							value: DEFAULT_APP_ID,
							required: true,
						},
					},
				},
				{
					command: 'crud shortlink list [--app <app-id>]',
					description: 'List shortlinks',
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
		surveyCommand,
		postCommand,
		lessonCommand,
		productCommand,
		shortlinkCommand,
	]),
	Command.withDescription('Content CRUD operations'),
)

const analyticsSurveyCommand = Command.make('survey', {}, () =>
	runAndPrint(async () =>
		respond(
			'analytics survey',
			{
				description: 'Survey analytics operations',
				commands: [
					{
						name: 'analytics',
						description: 'Survey analytics by slug or ID',
						usage:
							'aihero analytics survey analytics <slug-or-id> [--app <app-id>]',
					},
				],
			},
			[
				{
					command: 'analytics survey analytics <slug-or-id> [--app <app-id>]',
					description: 'Get survey analytics',
					params: {
						'slug-or-id': {
							description: 'Survey slug or ID',
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
	Command.withSubcommands([surveyAnalyticsCommand]),
	Command.withDescription('Survey analytics'),
)

const analyticsCommand = Command.make('analytics', {}, () =>
	runAndPrint(async () =>
		respond(
			'analytics',
			{
				description: 'Analytics surfaces for support and creator reporting',
				commands: [
					{
						name: 'survey',
						description: 'Survey analytics by slug or ID',
						usage:
							'aihero analytics survey analytics <slug-or-id> [--app <app-id>]',
					},
				],
			},
			[
				{
					command: 'analytics survey analytics <slug-or-id> [--app <app-id>]',
					description: 'Get survey analytics',
					params: {
						'slug-or-id': {
							description: 'Survey slug or ID',
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
	Command.withSubcommands([analyticsSurveyCommand]),
	Command.withDescription('Analytics operations'),
)

const trpcGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
		procedure: Args.text({ name: 'procedure' }).pipe(
			Args.withDescription('tRPC procedure path'),
		),
		query: Options.text('query').pipe(
			Options.withDescription('Raw query string'),
			Options.optional,
		),
	},
	({ app, baseUrl, token, noAuth, procedure, query }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: `trpc get ${procedure}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: `/api/trpc/${procedure.replace(/^\/+/, '')}${unwrapOption<string>(query) ? `?${unwrapOption<string>(query)}` : ''}`,
			}),
		),
).pipe(Command.withDescription('GET tRPC procedure endpoint'))

const trpcPostCommand = Command.make(
	'post',
	{
		...entityRequestOptions,
		procedure: Args.text({ name: 'procedure' }).pipe(
			Args.withDescription('tRPC procedure path'),
		),
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, procedure, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: `trpc post ${procedure}`,
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload
			return runEndpointCommand({
				command: `trpc post ${procedure}`,
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: `/api/trpc/${procedure.replace(/^\/+/, '')}`,
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('POST tRPC procedure endpoint'))

const trpcCommand = Command.make('trpc', {}, () =>
	runAndPrint(async () =>
		respond(
			'trpc',
			{
				description: 'tRPC endpoints',
				commands: [
					{
						name: 'get',
						description: 'GET tRPC procedure',
						usage: 'aihero trpc get <procedure> [--query <query>]',
					},
					{
						name: 'post',
						description: 'POST tRPC procedure',
						usage: "aihero trpc post <procedure> --body '<json>'",
					},
				],
			},
			[
				{
					command: 'trpc get <procedure> [--app <app-id>]',
					description: 'Call tRPC procedure',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([trpcGetCommand, trpcPostCommand]),
	Command.withDescription('tRPC endpoints'),
)

const uploadthingGetCommand = Command.make(
	'get',
	{
		...entityRequestOptions,
		query: Options.text('query').pipe(
			Options.withDescription('Raw query string'),
			Options.optional,
		),
	},
	({ app, baseUrl, token, noAuth, query }) =>
		runAndPrint(async () =>
			runEndpointCommand({
				command: 'uploadthing get',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'GET',
				pathname: `/api/uploadthing${unwrapOption<string>(query) ? `?${unwrapOption<string>(query)}` : ''}`,
			}),
		),
).pipe(Command.withDescription('GET /api/uploadthing'))

const uploadthingPostCommand = Command.make(
	'post',
	{
		...entityRequestOptions,
		body: bodyOption,
	},
	({ app, baseUrl, token, noAuth, body }) =>
		runAndPrint(async () => {
			const parsedBody = parseJsonOption({
				command: 'uploadthing post',
				option: 'body',
				value: unwrapOption<string>(body),
				required: true,
			})
			if (!parsedBody.ok) return parsedBody.payload

			return runEndpointCommand({
				command: 'uploadthing post',
				app,
				baseUrl,
				token,
				noAuth,
				method: 'POST',
				pathname: '/api/uploadthing',
				body: parsedBody.value,
			})
		}),
).pipe(Command.withDescription('POST /api/uploadthing'))

const uploadthingCommand = Command.make('uploadthing', {}, () =>
	runAndPrint(async () =>
		respond(
			'uploadthing',
			{
				description: 'UploadThing route handlers',
				commands: [
					{
						name: 'get',
						description: 'GET uploadthing route',
						usage: 'aihero uploadthing get [--query <query>]',
					},
					{
						name: 'post',
						description: 'POST uploadthing route',
						usage: "aihero uploadthing post --body '<json>'",
					},
				],
			},
			[
				{
					command: 'uploadthing get [--app <app-id>]',
					description: 'Inspect uploadthing route',
				},
			],
		),
	),
).pipe(
	Command.withSubcommands([uploadthingGetCommand, uploadthingPostCommand]),
	Command.withDescription('UploadThing endpoints'),
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
					'Agent-first AI Hero CLI focused on creator workflows, support actions, CRUD, and analytics',
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
				focus_areas: ['creator', 'support', 'crud', 'analytics'],
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
						name: 'creator',
						description:
							'Creator workflows for post publishing and video upload/inspection',
						usage: 'aihero creator',
					},
					{
						name: 'support',
						description: 'Support actions and workflows',
						usage: "aihero support action <action> --body '<json>'",
					},
					{
						name: 'crud',
						description:
							'CRUD surfaces for surveys, posts, lessons, products, and shortlinks',
						usage: 'aihero crud',
					},
					{
						name: 'analytics',
						description: 'Analytics surfaces for support and creator reporting',
						usage: 'aihero analytics',
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
					command: 'creator',
					description: 'Open creator-focused command surface',
				},
				{
					command: 'support action <action> --body <json> [--app <app-id>]',
					description: 'Run a support action',
					params: {
						action: {
							description: 'Support action path segment',
							required: true,
						},
					},
				},
				{
					command: 'crud',
					description: 'Open CRUD command surface',
				},
				{
					command: 'analytics',
					description: 'Open analytics command surface',
				},
				{
					command: 'crud survey list [--app <app-id>]',
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
	Command.withSubcommands([
		appCommand,
		authCommand,
		creatorCommand,
		supportCommand,
		crudCommand,
		analyticsCommand,
	]),
	Command.withDescription(
		'AI Hero CLI focused on creator workflows, support actions, CRUD, and analytics',
	),
)

const cli = Command.run(root, {
	name: CLI_NAME,
	version: CLI_VERSION,
})

const argv = process.argv.filter((arg) => arg !== '--json')

cli(argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)
