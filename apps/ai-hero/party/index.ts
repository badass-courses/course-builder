import { Buffer } from 'node:buffer'
import * as schema from '@/db/schema'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { Client, connect } from '@planetscale/database'
import { eq, or, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import type * as Party from 'partykit/server'
import { onConnect } from 'y-partykit'
import * as Y from 'yjs'

const BROADCAST_INTERVAL = 1000 / 60 // 60fps

const db = drizzle(
	new Client({
		url: env.DATABASE_URL,
		fetch: (url: string, init: any) => {
			delete (init as any)['cache'] // Remove cache header
			return fetch(url, init)
		},
	}),
	{ schema },
)

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET',
	'Access-Control-Allow-Headers':
		'Origin, X-Requested-With, Content-Type, Accept',
}

export default class Server implements Party.Server {
	constructor(readonly party: Party.Party) {}

	async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
		// A websocket just connected!
		console.log(
			`Connected:
          id: ${conn.id}
          room: ${this.party.id}
          url: ${new URL(ctx.request.url).pathname}`,
		)

		const party = this.party

		return onConnect(conn, this.party, {
			persist: { mode: 'snapshot' },
			async load() {
				try {
					console.log('[PartyKit] Loading document for:', party.id)
					const tip = await db.query.contentResource.findFirst({
						where: or(
							eq(
								sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
								party.id,
							),
							eq(contentResource.id, party.id),
						),
					})

					console.log('[PartyKit] Found resource:', {
						id: tip?.id,
						hasYDoc: !!tip?.fields?.yDoc,
						hasBody: !!tip?.fields?.body,
					})

					const doc = new Y.Doc()

					if (tip?.fields?.yDoc) {
						try {
							console.log('[PartyKit] Applying yDoc update for:', party.id)
							const update = Buffer.from(tip.fields.yDoc, 'base64')
							Y.applyUpdate(doc, new Uint8Array(update))
							console.log('[PartyKit] Successfully applied yDoc update')
						} catch (e) {
							console.error('[PartyKit] Failed to apply yDoc update:', e)
							// Fallback to body if yDoc update fails
							if (tip?.fields?.body) {
								console.log('[PartyKit] Falling back to body text')
								doc.getText('codemirror').insert(0, tip.fields.body)
							}
						}
					} else if (tip?.fields?.body) {
						console.log('[PartyKit] Setting initial body text')
						doc.getText('codemirror').insert(0, tip.fields.body)
					}

					console.log('[PartyKit] Final doc state:', {
						length: doc.getText('codemirror').length,
						content: doc.getText('codemirror').toString().slice(0, 100) + '...',
					})

					return doc
				} catch (e) {
					console.error('[PartyKit] Critical error in load:', e)
					// Return empty doc as last resort
					return new Y.Doc()
				}
			},
			callback: {
				handler: async (doc) => {
					console.log('callback handler', party.id)
					// autosave
				},
			},
		})
	}

	messages: string[] = []

	async onStart() {
		this.messages = (await this.party.storage.get<string[]>('messages')) ?? []
	}

	async onRequest(req: Party.Request) {
		if (req.method === 'GET') {
			// For SSR, return the current presence of all connections
			// const users = [...this.party.getConnections()].reduce(
			//   (acc, user) => ({...acc, [user.id]: this.getUser(user)}),
			//   {},
			// )
			return Response.json({ users: [] }, { status: 200, headers: CORS })
		}

		// respond to cors preflight requests
		if (req.method === 'OPTIONS') {
			return Response.json({ ok: true }, { status: 200, headers: CORS })
		}

		if (req.method === 'POST') {
			const messageBody: { requestId: string; body: string; name: string } =
				await req.json()

			this.party.broadcast(JSON.stringify(messageBody))

			return new Response(
				`Party ${this.party.id} has received ${this.messages.length} messages`,
			)
		}

		return new Response('Method Not Allowed', { status: 405 })
	}

	onMessage(message: string, sender: Party.Connection) {
		// let's log the message
		console.log(`connection ${sender.id} sent message: ${message}`)
		// as well as broadcast it to all the other connections in the room...
		this.party.broadcast(
			`${sender.id}: ${message}`,
			// ...except for the connection it came from
			[sender.id],
		)
	}
}

Server satisfies Party.Worker
