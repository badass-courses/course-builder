import { headers } from 'next/headers'
import { Purchase } from '@/app/rsc/purchase'
import { redis } from '@/server/redis-client'
import {
	TAnyToolDefinitionArray,
	TToolDefinitionMap,
} from '@/utils/tool-definition'
import { Ratelimit } from '@upstash/ratelimit'
import { OpenAIStream } from 'ai'
import { createAI, createStreamableUI, getMutableAIState, render } from 'ai/rsc'
import { OpenAI } from 'openai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { Button, Card, CardContent, CardHeader } from '@coursebuilder/ui'

function Spinner() {
	return <div>Loading...</div>
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

async function confirmPurchase(symbol: string, price: number, amount: number) {
	'use server'

	const aiState = getMutableAIState<typeof AI>()

	const purchasing = createStreamableUI(
		<div className="inline-flex items-start gap-1 md:items-center">
			<p className="mb-2">
				Purchasing {amount} ${symbol}...
			</p>
		</div>,
	)

	const systemMessage = createStreamableUI(null)

	runAsyncFnWithoutBlocking(async () => {
		// You can update the UI at any point.
		await sleep(1000)

		purchasing.update(
			<div className="inline-flex items-start gap-1 md:items-center">
				<p className="mb-2">
					Purchasing {amount} ${symbol}... working on it...
				</p>
			</div>,
		)

		await sleep(1000)

		purchasing.done(
			<div>
				<p className="mb-2">
					You have successfully purchased {amount} ${symbol}. Total cost:{' '}
					{formatNumber(amount * price)}
				</p>
			</div>,
		)

		systemMessage.done(
			<div>
				You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
				{formatNumber(amount * price)}.
			</div>,
		)

		aiState.done([
			...aiState.get(),
			{
				role: 'system',
				content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${amount * price}]`,
			},
		])
	})

	return {
		purchasingUI: purchasing.value,
		newMessage: {
			id: Date.now(),
			display: systemMessage.value,
		},
	}
}

async function submitUserMessage(content: string) {
	'use server'

	const ip = headers().get('x-forwarded-for')
	const ratelimit = new Ratelimit({
		redis,
		// rate limit to 5 requests per 10 seconds
		limiter: Ratelimit.slidingWindow(10, '12h'),
	})

	const { success, limit, reset, remaining } = await ratelimit.limit(
		`ratelimit_${ip}`,
	)

	if (!success) {
		return {
			id: Date.now(),
			display: (
				<div>Rate limit exceeded. Please try again in {reset} seconds.</div>
			),
		}
	}

	const aiState = getMutableAIState<typeof AI>()
	aiState.update([
		...aiState.get(),
		{
			role: 'user',
			content,
		},
	])

	const reply = createStreamableUI(
		<div className="items-center">
			<Spinner />
		</div>,
	)

	const completion = runOpenAICompletion(openai, {
		model: 'gpt-3.5-turbo',
		stream: true,
		messages: [
			{
				role: 'system',
				content: `\
You are a stock trading conversation bot and you can help users buy stocks, step by step.
You and the user can discuss stock prices and the user can adjust the amount of stocks they want to buy, or place an order, in the UI.

Messages inside [] means that it's a UI element or a user event. For example:
- "[Price of AAPL = 100]" means that an interface of the stock price of AAPL is shown to the user.
- "[User has changed the amount of AAPL to 10]" means that the user has changed the amount of AAPL to 10 in the UI.

If the user requests purchasing a stock, call \`show_stock_purchase_ui\` to show the purchase UI.
If the user just wants the price, call \`show_stock_price\` to show the price.
If you want to show trending stocks, call \`list_stocks\`.
If you want to show events, call \`get_events\`.
If the user wants to sell stock, or complete another impossible task, respond that you are a demo and cannot do that.

Besides that, you can also chat with users and do some calculations if needed.`,
			},
			...aiState.get().map((info: any) => ({
				role: info.role,
				content: info.content,
				name: info.name,
			})),
		],
		functions: [
			{
				name: 'show_stock_price',
				description:
					'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
				parameters: z.object({
					symbol: z
						.string()
						.describe(
							'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.',
						),
					price: z.number().describe('The price of the stock.'),
					delta: z.number().describe('The change in price of the stock'),
				}),
			},
			{
				name: 'show_stock_purchase_ui',
				description:
					'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
				parameters: z.object({
					symbol: z
						.string()
						.describe(
							'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.',
						),
					price: z.number().describe('The price of the stock.'),
					numberOfShares: z
						.number()
						.describe(
							'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.',
						),
				}),
			},
			{
				name: 'list_stocks',
				description: 'List three imaginary stocks that are trending.',
				parameters: z.object({
					stocks: z.array(
						z.object({
							symbol: z.string().describe('The symbol of the stock'),
							price: z.number().describe('The price of the stock'),
							delta: z.number().describe('The change in price of the stock'),
						}),
					),
				}),
			},
			{
				name: 'get_events',
				description:
					'List funny imaginary events between user highlighted dates that describe stock activity.',
				parameters: z.object({
					events: z.array(
						z.object({
							date: z
								.string()
								.describe('The date of the event, in ISO-8601 format'),
							headline: z.string().describe('The headline of the event'),
							description: z.string().describe('The description of the event'),
						}),
					),
				}),
			},
		],
		temperature: 0,
	})

	completion.onTextContent((content: string, isFinal: boolean) => {
		reply.update(<div>{content}</div>)
		if (isFinal) {
			reply.done()
			aiState.done([...aiState.get(), { role: 'assistant', content }])
		}
	})

	completion.onFunctionCall(
		'list_stocks',
		async ({ stocks }: { stocks: any[] }) => {
			reply.update(<div></div>)

			await sleep(1000)

			reply.done(
				<div>
					{stocks.map((stock: any) => (
						<Card key={stock.symbol}>
							<CardHeader>{stock.symbol}</CardHeader>
							<CardContent>
								Price: {stock.price}, Delta: {stock.delta}
							</CardContent>
						</Card>
					))}
				</div>,
			)

			aiState.done([
				...aiState.get(),
				{
					role: 'function',
					name: 'list_stocks',
					content: JSON.stringify(stocks),
				},
			])
		},
	)

	completion.onFunctionCall('get_events', async ({ events }) => {
		reply.update(<div></div>)

		await sleep(1000)

		reply.done(
			<div>
				{events.map((event: any) => (
					<Card key={event.headline}>
						<CardHeader>{event.headline}</CardHeader>
						<CardContent>{event.description}</CardContent>
					</Card>
				))}
			</div>,
		)

		aiState.done([
			...aiState.get(),
			{
				role: 'function',
				name: 'list_stocks',
				content: JSON.stringify(events),
			},
		])
	})

	completion.onFunctionCall(
		'show_stock_price',
		async ({ symbol, price, delta }: any) => {
			reply.update(
				<div>
					<Spinner />
				</div>,
			)

			await sleep(1000)

			reply.done(
				<div>
					Stock price of {symbol} is {price} ({delta})
				</div>,
			)

			aiState.done([
				...aiState.get(),
				{
					role: 'function',
					name: 'show_stock_price',
					content: `[Price of ${symbol} = ${price}]`,
				},
			])
		},
	)

	completion.onFunctionCall(
		'show_stock_purchase_ui',
		({ symbol, price, numberOfShares = 100 }) => {
			if (numberOfShares <= 0 || numberOfShares > 1000) {
				reply.done(<div>Invalid amount</div>)
				aiState.done([
					...aiState.get(),
					{
						role: 'function',
						name: 'show_stock_purchase_ui',
						content: `[Invalid amount]`,
					},
				])
				return
			}

			reply.done(
				<>
					<div>
						Sure!{' '}
						{typeof numberOfShares === 'number'
							? `Click the button below to purchase ${numberOfShares} shares of $${symbol}:`
							: `How many $${symbol} would you like to purchase?`}
					</div>
					<div>
						<Purchase
							defaultAmount={numberOfShares}
							name={symbol}
							price={+price}
						/>
					</div>
				</>,
			)
			aiState.done([
				...aiState.get(),
				{
					role: 'function',
					name: 'show_stock_purchase_ui',
					content: `[UI for purchasing ${numberOfShares} shares of ${symbol}. Current price = ${price}, total cost = ${
						numberOfShares * price
					}]`,
				},
			])
		},
	)

	return {
		id: Date.now(),
		display: reply.value,
	}
}

// Define necessary types and create the AI.

const initialAIState: {
	role: 'user' | 'assistant' | 'system' | 'function'
	content: string
	id?: string
	name?: string
}[] = []

const initialUIState: {
	id: number
	display: React.ReactNode
}[] = []

export const AI = createAI({
	actions: {
		submitUserMessage,
		confirmPurchase,
	},
	initialUIState,
	initialAIState,
})

const consumeStream = async (stream: ReadableStream) => {
	const reader = stream.getReader()
	while (true) {
		const { done } = await reader.read()
		if (done) break
	}
}

export function runOpenAICompletion<
	T extends Omit<
		Parameters<typeof OpenAI.prototype.chat.completions.create>[0],
		'functions'
	>,
	const TFunctions extends TAnyToolDefinitionArray,
>(
	openai: OpenAI,
	params: T & {
		functions: TFunctions
	},
) {
	let text = ''
	let hasFunction = false

	type TToolMap = TToolDefinitionMap<TFunctions>
	let onTextContent: (text: string, isFinal: boolean) => void = () => {}

	const functionsMap: Record<string, TFunctions[number]> = {}
	for (const fn of params.functions) {
		functionsMap[fn.name] = fn
	}

	let onFunctionCall = {} as any

	const { functions, ...rest } = params

	;(async () => {
		consumeStream(
			OpenAIStream(
				(await openai.chat.completions.create({
					...rest,
					stream: true,
					functions: functions.map((fn) => ({
						name: fn.name,
						description: fn.description,
						parameters: zodToJsonSchema(fn.parameters) as Record<
							string,
							unknown
						>,
					})),
				})) as any,
				{
					async experimental_onFunctionCall(functionCallPayload) {
						hasFunction = true

						if (!onFunctionCall[functionCallPayload.name]) {
							return
						}

						// we need to convert arguments from z.input to z.output
						// this is necessary if someone uses a .default in their schema
						const zodSchema = functionsMap[functionCallPayload.name]?.parameters

						if (!zodSchema) {
							throw new Error(
								`Function call ${functionCallPayload.name} not found in the provided functions`,
							)
						}

						const parsedArgs = zodSchema.safeParse(
							functionCallPayload.arguments,
						)

						if (!parsedArgs.success) {
							throw new Error(
								`Invalid function call in message. Expected a function call object`,
							)
						}

						onFunctionCall[functionCallPayload.name]?.(parsedArgs.data)
					},
					onToken(token) {
						text += token
						if (text.startsWith('{')) return
						onTextContent(text, false)
					},
					onFinal() {
						if (hasFunction) return
						onTextContent(text, true)
					},
				},
			),
		)
	})()

	return {
		onTextContent: (
			callback: (text: string, isFinal: boolean) => void | Promise<void>,
		) => {
			onTextContent = callback
		},
		onFunctionCall: <TName extends TFunctions[number]['name']>(
			name: TName,
			callback: (
				args: z.output<
					TName extends keyof TToolMap
						? TToolMap[TName] extends infer TToolDef
							? TToolDef extends TAnyToolDefinitionArray[number]
								? TToolDef['parameters']
								: never
							: never
						: never
				>,
			) => void | Promise<void>,
		) => {
			onFunctionCall[name] = callback
		},
	}
}

export const formatNumber = (value: number) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(value)

export const runAsyncFnWithoutBlocking = (
	fn: (...args: any) => Promise<any>,
) => {
	fn()
}

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))

// Fake data
export function getStockPrice(name: string) {
	let total = 0
	for (let i = 0; i < name.length; i++) {
		total = (total + name.charCodeAt(i) * 9999121) % 9999
	}
	return total / 100
}
