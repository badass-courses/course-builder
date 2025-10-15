import type * as Party from 'partykit/server'

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET',
	'Access-Control-Allow-Headers':
		'Origin, X-Requested-With, Content-Type, Accept',
}

export default class Server implements Party.Server {
	constructor(readonly party: Party.Party) {}

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
