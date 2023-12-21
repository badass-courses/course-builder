import type * as Party from 'partykit/server'
import {onConnect} from 'y-partykit'
import * as Y from 'yjs'

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
      async load() {
        const tip = await sanityQuery<{body: string | null} | null>(
          `*[_id == "${party.id}"][0]{body}`,
          party.env,
        )

        const doc = new Y.Doc()
        if (tip?.body) {
          doc.getText('codemirror').insert(0, tip.body)
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

  async onRequest(_req: Party.Request) {
    const messageBody: {requestId: string; body: string; name: string} =
      await _req.json()

    this.party.broadcast(JSON.stringify(messageBody))

    return new Response(
      `Party ${this.party.id} has received ${this.messages.length} messages`,
    )
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

export async function sanityQuery<T = any>(
  query: string,
  env: any,
  options: {useCdn?: boolean; revalidate?: number} = {
    useCdn: true,
    revalidate: 10,
  },
): Promise<T> {
  return await fetch(
    `https://${env.SANITY_STUDIO_PROJECT_ID}.${
      options.useCdn ? 'apicdn' : 'api'
    }.sanity.io/v${env.SANITY_STUDIO_API_VERSION}/data/query/${
      env.SANITY_STUDIO_DATASET
    }?query=${encodeURIComponent(query)}&perspective=published`,
    {
      method: 'get',
      headers: {
        Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
      },
      next: {revalidate: options.revalidate}, //seconds
    },
  )
    .then(async (response) => {
      if (response.status !== 200) {
        throw new Error(
          `Sanity Query failed with status ${response.status}: ${
            response.statusText
          }\n\n\n${JSON.stringify(await response.json(), null, 2)})}`,
        )
      }
      const {result} = await response.json()
      return result as T
    })
    .catch((error) => {
      console.error('FAAAAAAIIIILLLLL', error)
      throw error
    })
}
