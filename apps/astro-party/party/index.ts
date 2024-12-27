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
				console.log('loading the party', party.id)
				const tip = await db.query.contentResource.findFirst({
					where: or(
						eq(
							sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
							party.id,
						),
						eq(contentResource.id, party.id),
					),
				})

				const doc = new Y.Doc()
				if (tip?.fields?.yDoc) {
					const binaryString = atob(tip.fields.yDoc)
					const bytes = new Uint8Array(binaryString.length)
					for (let i = 0; i < binaryString.length; i++) {
						bytes[i] = binaryString.charCodeAt(i)
					}
					Y.applyUpdate(doc, bytes)
				} else if (tip?.fields?.body) {
					doc.getText('codemirror').insert(0, tip.fields.body)
				}
				return doc
			},
			callback: {
				handler: async (doc) => {
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
